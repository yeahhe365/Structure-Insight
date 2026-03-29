
import React from 'react';

export function useWindowSize() {
    const [size, setSize] = React.useState({ width: window.innerWidth, height: window.innerHeight });
    React.useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        const handleResize = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                setSize({ width: window.innerWidth, height: window.innerHeight });
            }, 100);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', handleResize);
        };
    }, []);
    return size;
}
