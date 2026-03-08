export interface Tattoo {
  id: string;
  image_url: string;
  price_min: number;
  price_max: number;
  description: string;
  created_at: string;
}

export interface QuizQuestion {
  tattoo: Tattoo;
  choices: [number, number][];
  correctIndex: number;
}

export interface QuizResult {
  tattoo: Tattoo;
  correctPrice: [number, number];
  chosenPrice: [number, number];
  isCorrect: boolean;
}
