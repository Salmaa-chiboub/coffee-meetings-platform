import { useEffect, useRef, useState } from 'react';

export const useIntersectionObserver = (options = {}) => {
  const [inView, setInView] = useState(false);
  const [entry, setEntry] = useState(null);
  const elementRef = useRef(null);

  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    triggerOnce = false,
    ...rest
  } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        setInView(isIntersecting);
        setEntry(entry);

        if (isIntersecting && triggerOnce) {
          observer.unobserve(element);
        }
      },
      {
        threshold,
        root,
        rootMargin,
        ...rest,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, triggerOnce]);

  return [elementRef, inView, entry];
};

export default useIntersectionObserver;
