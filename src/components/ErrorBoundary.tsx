import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  // @ts-ignore
  public props: Props;

  public state: State = {
    hasError: false,
    error: null,
  };

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
            <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              !
            </div>
            <h1 className="text-2xl font-bold mb-2">เกิดข้อผิดพลาดในการโหลดระบบ</h1>
            <p className="text-slate-400 text-sm mb-6">
              {this.state.error?.message || 'ระบบขัดข้องชั่วคราว กรุณากดปุ่มด้านล่างเพื่อรีโหลดหน้าเว็บ'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition"
            >
              รีโหลดหน้าเว็บ (Reload Page)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
