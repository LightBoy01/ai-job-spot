
import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import useAuth from '@/hooks/useAuth';
import { SerializedJobPosting, SerializedArticle } from '@/lib/types';

type Resource = SerializedJobPosting | SerializedArticle;

interface UseAdminResourceListParams<T extends Resource> {
  initialItems: T[];
  initialLastDocId: string | null;
  resourceName: string; // e.g., 'job', 'article'
  searchApiUrl: string; // e.g., '/api/admin/jobs/search'
  deleteApiUrlBase: string; // e.g., '/api/jobs'
}

const PAGE_SIZE = 10;

export const useAdminResourceList = <T extends Resource>({
  initialItems,
  initialLastDocId,
  resourceName,
  searchApiUrl,
  deleteApiUrlBase,
}: UseAdminResourceListParams<T>) => {
  const { loading: authLoading } = useAuth();
  const [items, setItems] = useState<T[]>(initialItems);
  const [lastDocId, setLastDocId] = useState<string | null>(initialLastDocId);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; title: string } | null>(null);

  const fetchResources = useCallback(
    async (query: string, startAfter: string | null) => {
      if (isLoading) return;

      setIsLoading(true);
      const toastId = toast.loading(`Loading ${resourceName}s...`);

      try {
        const params = new URLSearchParams({
          q: query,
          limit: String(PAGE_SIZE),
        });
        if (startAfter) {
          params.append('startAfter', startAfter);
        }

        const response = await fetch(`${searchApiUrl}?${params.toString()}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch ${resourceName}s`);
        }

        const data = await response.json();
        const fetchedItems = data.jobs || data.articles; // Handle both possible keys

        setItems((prevItems) =>
          startAfter ? [...prevItems, ...fetchedItems] : fetchedItems
        );
        setLastDocId(data.lastDocId);
        toast.success(`${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)}s loaded successfully!`, { id: toastId });
      } catch (error) {
        console.error(`Error fetching admin ${resourceName}s:`, error);
        toast.error(
          error instanceof Error ? error.message : 'An unknown error occurred',
          { id: toastId }
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, resourceName, searchApiUrl]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResources(searchQuery, null);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchResources('', null);
  };

  const loadMore = () => {
    if (lastDocId) {
      fetchResources(searchQuery, lastDocId);
    }
  };

  const handleDeleteClick = (id: string, title: string) => {
    setItemToDelete({ id, title });
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setIsModalOpen(false);
    const toastId = toast.loading(`Deleting ${resourceName} "${itemToDelete.title}"...`);

    try {
      const response = await fetch(`${deleteApiUrlBase}/${itemToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete ${resourceName}`);
      }

      toast.success(`${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)} "${itemToDelete.title}" deleted successfully!`, {
        id: toastId,
      });
      fetchResources(searchQuery, null); // Refetch current view
    } catch (error) {
      console.error(`Error deleting ${resourceName}:`, error);
      toast.error(
        error instanceof Error ? error.message : 'An unknown error occurred',
        { id: toastId }
      );
    } finally {
        setItemToDelete(null);
    }
  };

  const confirmationModalProps = {
    isOpen: isModalOpen,
    onClose: () => setIsModalOpen(false),
    onConfirm: handleConfirmDelete,
    title: `Confirm Deletion`,
    message: `Are you sure you want to delete this ${resourceName}? This action is permanent and cannot be undone.`,
  };

  return {
    items,
    isLoading: isLoading || authLoading,
    searchQuery,
    setSearchQuery,
    lastDocId,
    handleSearchSubmit,
    handleClearSearch,
    loadMore,
    handleDeleteClick,
    confirmationModalProps,
  };
};
