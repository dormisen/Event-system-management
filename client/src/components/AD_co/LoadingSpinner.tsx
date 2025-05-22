interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
}

const LoadingSpinner = ({ size = 'medium' }: LoadingSpinnerProps) => {
  const dimensions = {
    small: 'h-8 w-8',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  }[size];

  return (
    <div className="flex justify-center items-center h-screen">
      <div className={`animate-spin rounded-full ${dimensions} border-t-2 border-b-2 border-indigo-600`}></div>
    </div>
  );
};

export default LoadingSpinner;