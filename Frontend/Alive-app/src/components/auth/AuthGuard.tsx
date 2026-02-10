import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { LoadingSpinner } from '../feedback/Loading';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * 认证守卫组件
 * 用于保护需要登录才能访问的页面
 */
export function AuthGuard({
  children,
  fallback,
  redirectTo = '/auth/login',
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // 保存当前路径，登录后跳转回来
      navigate(redirectTo, {
        replace: true,
        state: { from: location.pathname },
      });
    }
  }, [isLoading, isAuthenticated, navigate, redirectTo, location.pathname]);

  // 加载中
  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      )
    );
  }

  // 未登录
  if (!isAuthenticated) {
    return null;
  }

  // 已登录
  return <>{children}</>;
}

/**
 * 游客守卫组件
 * 用于已登录用户不应该访问的页面（如登录页）
 */
export function GuestGuard({
  children,
  redirectTo = '/',
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // 如果有来源页面，跳转回去
      const from = (location.state as { from?: string })?.from || redirectTo;
      navigate(from, { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate, redirectTo, location.state]);

  // 加载中
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // 已登录
  if (isAuthenticated) {
    return null;
  }

  // 未登录（游客）
  return <>{children}</>;
}

/**
 * 可选认证组件
 * 不强制要求登录，但会检查认证状态
 */
export function OptionalAuth({ children }: { children: React.ReactNode }) {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}
