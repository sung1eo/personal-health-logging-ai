## ADDED Requirements

### Requirement: 사용자는 본인의 건강 기록만 조회할 수 있다
시스템 SHALL 모든 health_records 쿼리에 인증된 user_id 필터를 적용해야 한다.

#### Scenario: 본인 기록 조회
- **WHEN** 인증된 사용자가 `GET /api/health-records`를 호출한다
- **THEN** 해당 user_id의 기록만 반환한다

#### Scenario: 타인 기록 접근 차단
- **WHEN** 사용자 A가 사용자 B의 health_record ID로 직접 접근 시도한다
- **THEN** HTTP 404 또는 403을 반환한다

### Requirement: 건강 기록 생성 시 인증된 user_id가 자동으로 저장된다
시스템 SHALL AI Agent 및 API를 통한 기록 생성 시 JWT에서 추출한 user_id를 health_record에 저장해야 한다.

#### Scenario: 채팅을 통한 기록 생성
- **WHEN** 인증된 사용자가 채팅으로 증상을 기록한다
- **THEN** 생성된 health_record의 user_id가 인증된 사용자의 ID와 일치한다

### Requirement: 사용자는 본인의 대화만 조회할 수 있다
시스템 SHALL 모든 conversations 및 messages 쿼리에 인증된 user_id 필터를 적용해야 한다.

#### Scenario: 대화 생성
- **WHEN** 인증된 사용자가 새 대화를 시작한다
- **THEN** conversation의 user_id가 인증된 사용자의 ID와 일치한다

#### Scenario: 대화 조회
- **WHEN** 인증된 사용자가 대화 목록을 조회한다
- **THEN** 해당 user_id의 대화만 반환한다
