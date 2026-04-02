## ADDED Requirements

### Requirement: 증상 기록은 부위·증상·시간·컨텍스트를 포함한다
health_record SHALL 신체 부위(body_part), 증상 텍스트(symptom_text), 발생 시각(occurred_at), 사용자 입력 원문 컨텍스트(context_text), 기록 출처(source)를 포함해야 한다.

#### Scenario: 채팅에서 생성된 기록 구조
- **WHEN** AI가 채팅 대화에서 증상을 추출하여 저장한다
- **THEN** health_record에 body_part, symptom_text, occurred_at, context_text, source=chat 필드가 모두 저장된다

#### Scenario: occurred_at이 null인 기록 허용
- **WHEN** 사용자가 날짜·시간을 명시하지 않고 증상을 기록한다
- **THEN** health_record가 occurred_at=null로 저장된다

### Requirement: 사용자가 달력에서 기록을 직접 수정할 수 있다
사용자 SHALL 달력 상세 화면에서 기존 health_record의 신체 부위, 증상 텍스트, 발생 시각, 컨텍스트를 수정할 수 있어야 한다.

#### Scenario: 달력에서 기록 수정
- **WHEN** 사용자가 달력 상세 화면에서 특정 기록의 수정 버튼을 누른다
- **THEN** 해당 기록의 편집 폼이 표시되고 수정 후 저장할 수 있다

#### Scenario: 채팅 대화를 통한 기록 수정
- **WHEN** 사용자가 채팅에서 "아까 기록한 거 등 말고 허리였어"라고 말한다
- **THEN** AI가 가장 최근 관련 기록을 찾아 body_part를 업데이트한다

### Requirement: body_part는 정해진 분류 체계를 따른다
body_part SHALL 다음 값 중 하나여야 한다: 머리, 목, 가슴, 복부, 등, 허리, 팔, 다리, 전신, 기타.

#### Scenario: 유효한 부위 분류
- **WHEN** AI가 "두통"을 추출한다
- **THEN** body_part가 "머리"로 저장된다

#### Scenario: 분류 불가 부위 처리
- **WHEN** 증상이 위 분류에 명확히 속하지 않는다
- **THEN** body_part가 "기타"로 저장되고 context_text에 원문이 보존된다
