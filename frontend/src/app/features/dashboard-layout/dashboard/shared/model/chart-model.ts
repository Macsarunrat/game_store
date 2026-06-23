export interface scoreModel {
  total_income: number;
  best_seller_game: string;
  total_order: number;
  active_user_a_day: number;
}

export interface areaModel {
  date: string | any;
  income: (number | null)[];
}
