import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Category, Product } from '../types';
import { getAuthToken } from '../lib/auth';

export function useMenu() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenuData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token found');

      const res = await fetch('/api/restaurant/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch menu data');
      
      const data = await res.json();
      setCategories(data.categories || []);
      setProducts(data.products || []);
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to load menu data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  const addCategory = async (name: string) => {
    const token = getAuthToken();
    const res = await fetch('/api/restaurant/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to add category');
    }
    
    const newCat = await res.json();
    setCategories(prev => [...prev, newCat]);
    toast.success('Category added');
    return newCat;
  };

  const deleteCategory = async (catId: string) => {
    const token = getAuthToken();
    const res = await fetch(`/api/restaurant/categories/${catId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) {
      toast.error('Failed to delete category');
      throw new Error('Failed to delete category');
    }
    
    setCategories(prev => prev.filter(c => c.id !== catId));
    setProducts(prev => prev.filter(p => p.categoryId !== catId));
    toast.success('Category deleted');
  };

  const saveProduct = async (productData: any, productId?: string) => {
    const token = getAuthToken();
    const url = productId ? `/api/restaurant/products/${productId}` : '/api/restaurant/products';
    const method = productId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(productData)
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || 'Failed to save product');
      throw new Error(data.error || 'Failed to save product');
    }

    const savedProduct = await res.json();
    if (productId) {
      setProducts(prev => prev.map(p => p.id === productId ? savedProduct : p));
      toast.success('Product updated');
    } else {
      setProducts(prev => [savedProduct, ...prev]);
      toast.success('Product added');
    }
    return savedProduct;
  };

  const deleteProduct = async (productId: string) => {
    const token = getAuthToken();
    const res = await fetch(`/api/restaurant/products/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) {
      toast.error('Failed to delete product');
      throw new Error('Failed to delete product');
    }
    
    setProducts(prev => prev.filter(p => p.id !== productId));
    toast.success('Product deleted');
  };

  const toggleProductAvailability = async (product: Product) => {
    const newStatus = !product.isAvailable;
    
    // Optimistic update
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isAvailable: newStatus } : p));

    try {
      const token = getAuthToken();
      await fetch(`/api/restaurant/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...product, isAvailable: newStatus })
      });
      toast.success(newStatus ? 'Product is now available' : 'Product is now unavailable');
    } catch (err) {
      // Revert on error
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isAvailable: !newStatus } : p));
      toast.error('Failed to update status');
      throw err;
    }
  };

  return {
    categories,
    products,
    loading,
    error,
    refresh: fetchMenuData,
    addCategory,
    deleteCategory,
    saveProduct,
    deleteProduct,
    toggleProductAvailability
  };
}

