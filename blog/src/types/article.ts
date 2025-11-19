export interface Article {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  articleId: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  date: string;
  tags: string;
  logo?: string;
  slug?: string;
}

export interface ArticleListResponse {
  documents: Article[];
  total: number;
}
