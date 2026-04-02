## ADDED Requirements

### Requirement: Google OAuth 2.0로 로그인할 수 있다
시스템 SHALL Google OAuth 2.0 Authorization Code Flow를 통해 사용자를 인증하고 JWT를 발급해야 한다.

#### Scenario: Google 로그인 시작
- **WHEN** 사용자가 로그인 페이지에서 "Google로 로그인" 버튼을 클릭한다
- **THEN** 백엔드 `/auth/google`로 이동하고, Google OAuth 인증 페이지로 redirect된다

#### Scenario: 로그인 성공
- **WHEN** 사용자가 Google에서 권한을 허용한다
- **THEN** 백엔드가 JWT를 발급하고 프론트엔드 `/auth/callback?token=<jwt>`로 redirect한다

#### Scenario: 신규 사용자 자동 가입
- **WHEN** 처음 로그인하는 Google 계정이다
- **THEN** users 테이블에 google_id, email, name, picture를 저장하고 JWT를 발급한다

#### Scenario: 기존 사용자 재로그인
- **WHEN** 이미 가입된 Google 계정으로 로그인한다
- **THEN** 기존 users 레코드를 조회하여 JWT를 발급한다 (중복 생성 없음)

### Requirement: JWT로 API 인증을 처리한다
모든 `/api/*` 엔드포인트 SHALL 유효한 JWT 토큰을 요구해야 한다.

#### Scenario: 유효한 토큰으로 API 접근
- **WHEN** 요청 헤더에 `Authorization: Bearer <valid-jwt>`가 포함된다
- **THEN** 요청이 정상 처리된다

#### Scenario: 토큰 없이 API 접근
- **WHEN** Authorization 헤더 없이 `/api/*` 엔드포인트에 접근한다
- **THEN** HTTP 401 응답을 반환한다

#### Scenario: 만료된 토큰으로 API 접근
- **WHEN** 만료된 JWT로 요청한다
- **THEN** HTTP 401 응답을 반환한다

### Requirement: 현재 로그인 사용자 정보를 조회할 수 있다
시스템 SHALL `GET /auth/me` 엔드포인트를 통해 현재 인증된 사용자의 정보를 반환해야 한다.

#### Scenario: 인증된 사용자 정보 조회
- **WHEN** 유효한 JWT로 `GET /auth/me`를 호출한다
- **THEN** user_id, email, name, picture를 포함한 JSON을 반환한다

### Requirement: 로그아웃할 수 있다
시스템 SHALL 프론트엔드에서 JWT를 삭제하여 로그아웃을 처리해야 한다.

#### Scenario: 로그아웃
- **WHEN** 사용자가 로그아웃 버튼을 클릭한다
- **THEN** localStorage에서 JWT가 삭제되고 로그인 페이지로 이동한다

### Requirement: 미인증 사용자는 로그인 페이지로 redirect된다
프론트엔드 SHALL JWT가 없는 경우 모든 페이지 접근을 `/login`으로 redirect해야 한다.

#### Scenario: 비로그인 상태에서 채팅 접근
- **WHEN** JWT 없이 `/chat`에 접근한다
- **THEN** `/login` 페이지로 redirect된다
