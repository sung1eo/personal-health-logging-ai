## MODIFIED Requirements

### Requirement: AI Agent는 인증된 사용자의 컨텍스트로 증상을 추출하고 저장한다
AI Agent SHALL 채팅 API 요청에서 JWT로 인증된 user_id를 기반으로 해당 사용자의 과거 기록을 조회하고, 새 기록을 해당 user_id로 저장해야 한다.

#### Scenario: 인증된 사용자의 증상 저장
- **WHEN** 인증된 사용자가 채팅으로 증상을 입력한다
- **THEN** 생성된 health_record의 user_id가 인증된 사용자와 일치한다

#### Scenario: 패턴 감지는 본인 기록만 참조한다
- **WHEN** AI Agent가 과거 증상 패턴을 조회한다
- **THEN** 인증된 user_id의 기록만 사용하여 패턴을 감지한다
