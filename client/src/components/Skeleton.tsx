interface SkeletonProps {
    className?: string;
  }
  
  const Skeleton = ({ className = '' }: SkeletonProps) => {
    return (
      <div
        className={`animate-pulse bg-gray-200 ${className}`}
        role="status"
        aria-label="loading"
      />
    );
  };
  
  export default Skeleton;