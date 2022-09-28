import { createTheme, ThemeProvider } from '@mui/material';
import React from 'react';
import NeatEditor from "./shape/NeatEditor";
import { green, yellow, grey } from '@mui/material/colors';

function App() {

    const theme = createTheme({
        palette: {
            primary: {
                main: grey[700],
            },
            secondary: {
                main: yellow[500],
            },
        },
    });
    return (
        <ThemeProvider theme={theme}>
            <div className="App">

                <NeatEditor/>

                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100vh",
                }}>

                    <div style={{
                        color: "rgb(255 255 255)",
                        opacity: .8,
                        mixBlendMode: "overlay",
                        margin: "auto",
                        fontFamily: '"Roboto", roboto-condensed,sans-serif',
                        fontWeight: 900,
                        fontSize: "18vw",
                    }}>
                        NEAT
                    </div>
                </div>
            </div>
        </ThemeProvider>

    );
}

export default App;
