export const getAuthToken = () => localStorage.getItem('token');
export const setAuthToken = (token: string) => localStorage.setItem('token', token);
export const removeAuthToken = () => localStorage.removeItem('token');

export const getAuthUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const setAuthUser = (user: any) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const logout = () => {
  removeAuthToken();
  localStorage.removeItem('user');
};
