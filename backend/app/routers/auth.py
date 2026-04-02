from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

import httpx

from app.auth.dependencies import get_current_user
from app.auth.jwt import create_access_token
from app.config import settings
from app.database import get_db
from app.models.models import User

router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
REDIRECT_URI = "http://localhost:8000/auth/google/callback"


class UserOut(BaseModel):
    id: int
    email: str | None
    name: str | None
    picture: str | None

    class Config:
        from_attributes = True


@router.get("/google")
def google_login():
    """Google OAuth 인증 페이지로 redirect."""
    if not settings.google_client_id:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID not configured")

    params = (
        f"client_id={settings.google_client_id}"
        f"&redirect_uri={REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=openid%20email%20profile"
        f"&access_type=offline"
    )
    return RedirectResponse(url=f"{GOOGLE_AUTH_URL}?{params}")


@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Google OAuth callback — code → token → 유저 upsert → JWT 발급 → 프론트 redirect."""
    # 1. code → access_token 교환
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )

    if token_resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to exchange code for token")

    access_token = token_resp.json().get("access_token")

    # 2. access_token → Google 유저 정보 조회
    async with httpx.AsyncClient() as client:
        userinfo_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )

    if userinfo_resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to get user info from Google")

    info = userinfo_resp.json()
    google_id = info.get("id")
    email = info.get("email")
    name = info.get("name")
    picture = info.get("picture")

    # 3. users upsert (google_id 기준)
    user = db.query(User).filter(User.google_id == google_id).first()
    if not user:
        # 같은 이메일로 가입된 계정이 있으면 연결
        user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(google_id=google_id, email=email, name=name, picture=picture)
        db.add(user)
    else:
        user.google_id = google_id
        user.name = name
        user.picture = picture

    db.commit()
    db.refresh(user)

    # 4. JWT 발급 → 프론트 redirect
    jwt_token = create_access_token(user.id)
    return RedirectResponse(url=f"{settings.frontend_url}/auth/callback?token={jwt_token}")


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
