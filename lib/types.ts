export interface Tattoo {
  id: string;
  image_url: string;
  price: number;
  created_at: string;
}

export interface QuizQuestion {
  tattoo: Tattoo;
  choices: number[];
  correctIndex: number;
}

export interface QuizResult {
  tattoo: Tattoo;
  correctPrice: number;
  chosenPrice: number;
  isCorrect: boolean;
}
