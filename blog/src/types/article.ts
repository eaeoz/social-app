export interface Article {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  title: string;
  content: string;
  excerpt?: string;
  author: string;
  authorEmail?: string;
  category?: string;
  tags?: string[];
  imageUrl?: string;
  published: boolean;
  views?: number;
  slug?: string;
}

export interface ArticleListResponse {
  documents: Article[];
  total: number;
}
