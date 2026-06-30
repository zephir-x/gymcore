import { useEffect } from 'react';

export function useDocumentTitle(title: string) {
    useEffect(() => {
        const originalTitle = document.title;

        // We set a new title
        document.title = `${title} | GymCore`;

        // After unmounting the component, we can (but do not have to) restore the old one
        return () => {
            document.title = originalTitle;
        };
    }, [title]); // The hook will only restart when the 'title' parameter changes
}