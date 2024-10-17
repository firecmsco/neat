import React, { useEffect } from 'react';
import NeatEditor from "./components/NeatEditor";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { Analytics } from "@firebase/analytics";

function App() {
    const [analytics, setAnalytics] = React.useState<Analytics | null>(null);
    useEffect(() => {
        const firebaseConfig = {
            apiKey: "AIzaSyDMtPBiCfiLN4g04xbCUfzIoRfcXkoYAe4",
            authDomain: "neat-co.firebaseapp.com",
            projectId: "neat-co",
            storageBucket: "neat-co.appspot.com",
            messagingSenderId: "492458106165",
            appId: "1:492458106165:web:c8cb7a6def427e1854c07c",
            measurementId: "G-QZ009D2ZWL"
        };

        const app = initializeApp(firebaseConfig);
        const analytics = getAnalytics(app);
        setAnalytics(analytics);
    }, []);

    return (
        <>
            {analytics && <NeatEditor analytics={analytics}/>}
        </>

    );
}

export default App;
