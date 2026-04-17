export interface Post {
    id: string;
    caption: string;
    createdAt: string;
    imageUrl?: string | null;
  }

export interface PostsProps {
    posts: Post[];
}