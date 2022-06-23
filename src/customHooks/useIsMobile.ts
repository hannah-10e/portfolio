import { useEffect, useState } from 'react';

const MOBILE_SIZE_BREAKPOINT = 770;

export default function useIsMobile(breakPoint?: number): boolean {
    const mobileBreakpoint = breakPoint ? breakPoint : MOBILE_SIZE_BREAKPOINT;
    const mobileState = window.innerWidth <= mobileBreakpoint;
    let [isMobile, setIsMobile] = useState<boolean>(mobileState);

    useEffect(() => {
        function useFindWidth() {
            const mobileState = window.innerWidth <= mobileBreakpoint;
            setIsMobile(mobileState);
        }
        window.addEventListener('resize', useFindWidth);
        return () => window.removeEventListener('resize', useFindWidth);
    });

    return isMobile;
}