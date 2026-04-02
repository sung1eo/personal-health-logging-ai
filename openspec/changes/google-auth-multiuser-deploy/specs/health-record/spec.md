## MODIFIED Requirements

### Requirement: 건강 기록 CRUD는 인증된 사용자만 수행할 수 있다
health_record의 생성, 조회, 수정, 삭제 SHALL 유효한 JWT로 인증된 사용자만 수행할 수 있으며, 본인의 기록에만 접근할 수 있다.

#### Scenario: 인증된 사용자의 기록 생성
- **WHEN** 유효한 JWT를 가진 사용자가 기록 생성을 요청한다
- **THEN** 해당 user_id로 health_record가 생성된다

#### Scenario: 인증되지 않은 기록 생성 시도
- **WHEN** JWT 없이 기록 생성을 요청한다
- **THEN** HTTP 401을 반환한다

#### Scenario: 타인 기록 수정 시도
- **WHEN** 사용자 A가 사용자 B 소유의 health_record를 수정하려 한다
- **THEN** HTTP 403 또는 404를 반환한다
