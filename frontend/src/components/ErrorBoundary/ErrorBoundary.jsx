import { Component } from 'react';
// =============================================================================
// Граница ошибок (единственный классовый компонент в проекте — React требует
// класс для componentDidCatch/getDerivedStateFromError).
// Ловит ошибки рендера в дочернем дереве и показывает аккуратный экран
// вместо «белого экрана смерти». Кнопка возвращает на главную.
// =============================================================================
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Перехвачена ошибка рендера:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.assign('/');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center px-4">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-white mb-2">Что-то пошло не так</h1>
          <p className="text-slate-400 mb-8 max-w-md">
            Произошла непредвиденная ошибка. Попробуйте обновить страницу.
          </p>
          <button
            onClick={this.handleReload}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg shadow-blue-900/20"
          >
            На главную
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
