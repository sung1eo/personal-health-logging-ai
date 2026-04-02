## ADDED Requirements

### Requirement: 자연어에서 신체 부위와 증상을 자동 추출한다
AI SHALL 사용자의 자연어 입력에서 신체 부위(body_part), 증상 텍스트(symptom_text), 발생 시간대(occurred_at)를 추출하여 구조화된 형태로 저장해야 한다.

#### Scenario: 단일 부위 증상 추출
- **WHEN** 사용자가 "오늘 오후에 배가 아팠어"라고 입력한다
- **THEN** AI가 body_part=복부, symptom_text=복통, occurred_at=오늘 오후로 추출하여 health_record에 저장한다

#### Scenario: 다중 부위 증상 추출
- **WHEN** 사용자가 "머리도 아프고 배도 아파"라고 입력한다
- **THEN** AI가 머리와 복부 각각 별개의 health_record로 저장한다

#### Scenario: 시간대 포함 추출
- **WHEN** 사용자가 "밥 먹고 나서 속이 쓰렸어"라고 입력한다
- **THEN** AI가 body_part=복부, context_text에 "식후" 정보가 포함된 health_record를 저장한다

### Requirement: 현재 날짜 기반으로 상대적 날짜 표현을 해석한다
AI SHALL 시스템에서 제공받은 현재 날짜를 기준으로 "어제", "오늘", "그제" 등의 상대적 표현을 절대 날짜로 변환해야 한다.

#### Scenario: 상대 날짜 해석
- **WHEN** 사용자가 "어제 저녁에 머리가 아팠어"라고 입력한다
- **THEN** AI가 현재 날짜 기준으로 어제 날짜를 계산하여 occurred_at에 반영한다

### Requirement: 모호한 부위는 추정 기록 후 확인 질문을 한다
추출된 신체 부위가 모호하거나 불확실한 경우, AI SHALL 가장 가능성 높은 부위로 일단 기록하고 사용자에게 확인 질문을 해야 한다.

#### Scenario: 모호한 부위 추정 후 확인
- **WHEN** 사용자가 "속이 안 좋아"처럼 부위가 명확하지 않게 입력한다
- **THEN** AI가 복부로 추정 기록하고 "복부로 기록했는데, 맞나요?" 형태로 확인 질문을 한다

#### Scenario: 사용자가 확인 질문에 수정 응답
- **WHEN** 사용자가 "아니, 가슴 쪽이 더 맞아"라고 정정한다
- **THEN** AI가 기존 기록의 body_part를 가슴으로 업데이트한다

### Requirement: 날짜가 특정되지 않아도 대화는 저장된다
사용자가 날짜를 명시하지 않은 경우에도 대화 자체는 저장되어야 한다.

#### Scenario: 날짜 미특정 대화 저장
- **WHEN** 사용자가 날짜 언급 없이 증상을 이야기한다
- **THEN** AI가 날짜를 물어볼 수 있으나, 응답하지 않아도 대화는 저장되고 occurred_at은 null로 기록된다
