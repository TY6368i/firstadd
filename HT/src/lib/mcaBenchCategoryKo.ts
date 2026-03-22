/**
 * MCA-Bench 종목별 한글 설명 (Kaggle luffy798/mca-benchmultimodal-captchas)
 * manifest.json 의 key(slug)와 동일해야 합니다.
 */
export type CategoryKoMeta = {
  titleKo: string
  summaryKo: string
  /** 사용자에게 보여 줄 과제 안내 */
  taskKo: string
  /** 격자/선택형일 때 추가 안내 */
  gridHelpKo?: string
}

export const MCA_CATEGORY_KO: Record<string, CategoryKoMeta> = {
  '3x3-grid-selection': {
    titleKo: '3×3 격자 선택',
    summaryKo: '큰 이미지를 3×3으로 나눈 칸 중, 지시한 물체가 있는 칸만 골라 클릭하는 캡차입니다.',
    taskKo: '영문 지시를 읽고, 해당하는 격자 칸을 모두 선택한 뒤 확인을 누르세요.',
    gridHelpKo: '왼쪽 위부터 0번, 오른쪽으로 1·2, 다음 줄이 3·4·5 … 순서입니다.',
  },
  '3x3-jigsaw-swap-selection': {
    titleKo: '3×3 직소 맞추기',
    summaryKo: '9칸 중 잘못 놓인 타일 두 칸을 골라 바로잡는 유형입니다.',
    taskKo: '데이터 라벨에 적힌 두 칸 번호에 해당하는 격자를 선택하세요.',
    gridHelpKo: '0~8 번호는 3×3에서 왼쪽 위부터 가로로 증가합니다.',
  },
  'alignment-sliders': {
    titleKo: '레이어 정렬 슬라이더',
    summaryKo: '여러 겹 이미지를 슬라이더로 맞추는 조작형 캡차입니다.',
    taskKo: '배경 이미지를 확인하세요. (웹 연습은 이미지 열람 위주이며, 실제 서비스는 드래그로 정렬합니다.)',
  },
  'arithmetic-character-captcha': {
    titleKo: '산술 문자 캡차',
    summaryKo: '이미지에 적힌 식을 계산해 답을 입력합니다.',
    taskKo: '식의 결과(숫자)를 입력하고 확인하세요. 음수면 마이너스 기호를 포함합니다.',
  },
  'arithmetic-selection': {
    titleKo: '숫자 합 맞추기 (클릭)',
    summaryKo: '화면의 숫자들 중 세 개를 골라 합이 목표값이 되게 하는 유형입니다.',
    taskKo: '라벨에 나온 세 개의 영역(숫자)을 모두 클릭해 선택하세요.',
  },
  'brightness-discrimination': {
    titleKo: '밝기 구별',
    summaryKo: '이미지에서 가장 어두운 별과 가장 밝은 별을 찾아 클릭합니다.',
    taskKo: '정답으로 표시된 두 영역을 모두 클릭하세요.',
  },
  'classic-character-captcha': {
    titleKo: '클래식 문자 캡차',
    summaryKo: '왜곡된 문자를 읽어 입력하는 전통적인 텍스트 캡차입니다.',
    taskKo: '이미지에 보이는 문자를 입력해 보세요. (이 샘플에는 공개 라벨 파일이 없어 채점은 연습용입니다.)',
  },
  'color-discrimination': {
    titleKo: '색 구별',
    summaryKo: '지시한 색(예: 분홍)의 도형을 찾아 클릭합니다.',
    taskKo: '라벨에 적힌 영역을 클릭해 선택하세요.',
  },
  'commonsense-reasoning': {
    titleKo: '상식·논리 추론',
    summaryKo: '짧은 질문에 논리적으로 답하는 텍스트형 캡차입니다.',
    taskKo: '질문을 읽고 답을 입력한 뒤 확인하세요. (영문 데이터셋 기준)',
  },
  'distorted-word-captcha': {
    titleKo: '왜곡 단어',
    summaryKo: '이미지에 있는 영어 단어 두 개를 순서대로 입력합니다.',
    taskKo: '지시에 맞게 단어를 공백으로 구분해 입력하세요.',
  },
  'full-image-grid-selection': {
    titleKo: '전체 그리드 선택',
    summaryKo: '큰 격자에서 특정 대상(예: 양)이 있는 칸을 모두 고릅니다.',
    taskKo: '라벨에 적힌 칸 번호를 3×3 격자에서 모두 선택하세요.',
    gridHelpKo: '번호는 보통 0부터 시작하는 격자 인덱스입니다.',
  },
  'geometric-shape-recognition': {
    titleKo: '도형 인식',
    summaryKo: '지시에 맞는 도형(예: 원)이 있는 영역을 모두 클릭합니다.',
    taskKo: '라벨에 나온 모든 영역을 클릭해 선택하세요.',
  },
  'hollow-pattern-recognition': {
    titleKo: '속 빈 도형',
    summaryKo: '속이 비어 있는 도형만 골라 클릭합니다.',
    taskKo: '라벨에 표시된 영역을 모두 클릭하세요.',
  },
  'inverted-letter-selection': {
    titleKo: '뒤집힌 글자',
    summaryKo: '거꾸로 뒤집혀 있는 글자가 있는 칸을 모두 찾습니다.',
    taskKo: '라벨의 좌표 영역에 해당하는 부분을 모두 클릭하세요.',
  },
  'rotated-letter-selection': {
    titleKo: '회전한 대문자',
    summaryKo: '지정한 각도만큼 반시계 방향으로 돌아간 대문자를 클릭합니다.',
    taskKo: '라벨에 적힌 영역을 클릭하세요.',
  },
  'rotation-block': {
    titleKo: '회전 슬라이더',
    summaryKo: '슬라이더로 이미지 각도를 맞추는 조작형 캡차입니다.',
    taskKo: '이미지를 확인하세요. (실제 과제는 회전 조작이 포함됩니다.)',
  },
  'sequential-letter-ordering': {
    titleKo: '순서대로 글자 클릭',
    summaryKo: '제시된 글자를 지정된 순서대로 차례로 클릭합니다.',
    taskKo: '라벨에 나온 순서대로 영역을 모두 클릭해 선택하세요.',
  },
  'sliding-block': {
    titleKo: '슬라이딩 퍼즐',
    summaryKo: '퍼즐 조각을 드래그해 빈칸에 맞추는 유형입니다.',
    taskKo: '배경·조각 이미지를 확인하세요. (실제 과제는 드래그 조작입니다.)',
  },
  'text-based-arithmetic': {
    titleKo: '텍스트 산술',
    summaryKo: '간단한 사칙연산 문제에 답을 입력합니다.',
    taskKo: '질문을 읽고 숫자 답을 입력한 뒤 확인하세요.',
  },
  'vowel-selection': {
    titleKo: '모음 선택',
    summaryKo: '이미지 속 영어 모음(A,E,I,O,U)만 모두 클릭합니다.',
    taskKo: '라벨에 나온 모든 모음 영역을 클릭하세요.',
  },
}

export function getCategoryKo(key: string): CategoryKoMeta {
  return (
    MCA_CATEGORY_KO[key] ?? {
      titleKo: key,
      summaryKo: 'MCA-Bench 캡차 유형입니다.',
      taskKo: '지시에 따라 과제를 완료하세요.',
    }
  )
}
