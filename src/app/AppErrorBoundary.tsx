import { Component, type PropsWithChildren } from 'react';

interface State { failed: boolean }

export class AppErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true };
  }

  retry = (): void => window.location.reload();

  render() {
    if (this.state.failed) {
      return (
        <main dir="rtl" lang="ar" className="grid min-h-dvh place-content-center gap-4 bg-canvas p-6 text-center text-ink" role="alert">
          <h1 className="text-2xl font-bold">حصلت مشكلة، جرّب تاني.</h1>
          <p className="text-muted">ممكن تعيد تحميل الصفحة أو ترجع للصفحة الرئيسية.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={this.retry} className="min-h-11 rounded-xs bg-primary-strong px-5 font-semibold text-on-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">جرّب تاني</button>
            <a href="/ar" className="inline-flex min-h-11 items-center rounded-xs border border-border px-5 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">الصفحة الرئيسية</a>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
