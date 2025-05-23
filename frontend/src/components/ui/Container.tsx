type ContainerProps = {
  children: React.ReactNode;
  className?: string;
};

const Container = ({ children, className = "" }: ContainerProps) => {
  return (
    <div className={`max-w-[1440px] mx-auto ${className}`}>{children}</div>
  );
};

export default Container;
