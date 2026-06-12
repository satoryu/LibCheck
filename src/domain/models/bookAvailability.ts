import { LibraryStatus } from '@/domain/models/libraryStatus';

export interface BookAvailability {
  isbn: string;
  libraryStatuses: Record<string, LibraryStatus>;
}
