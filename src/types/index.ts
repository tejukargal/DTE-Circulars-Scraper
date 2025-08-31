export interface ScrapedData {
  title: string;
  url: string;
  content: string;
  images: string[];
  links: Array<{
    text: string;
    href: string;
  }>;
  metadata: {
    description?: string;
    keywords?: string;
    author?: string;
    publishDate?: string;
  };
  circulars?: Array<{
    title: string;
    link: string;
    date?: string;
    orderNo?: string;
  }>;
}

export interface ApiResponse {
  success: boolean;
  data?: ScrapedData;
  error?: string;
}