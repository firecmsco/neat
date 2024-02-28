import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import React from "react";
import { NeatConfig } from "@firecms/neat";

export function CodeDialog({
                               open,
                               onClose,
                               config
                           }: {
    open: boolean, onClose: () => void;
    config: NeatConfig
}) {

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>That's a nice looking background!</DialogTitle>
            <DialogContent>
                <p>
                    Install the package using npm or yarn, following the instructions in the <a
                    target={"_blank"}
                    href="https://www.npmjs.com/package/@firecms/neat">package page</a>.
                </p>
                <p>
                    Use the following code to initialize your NeatGradient:
                </p>
                <Box component={"pre"}
                     sx={{
                         p: 2,
                         borderRadius: "8px",
                         background: "#333",
                         color: "#fff",
                     }}>
                    {JSON.stringify(config, null, 4)}
                </Box>

                <p>If you think you have a great combination, feel free to share it with us by <a
                    href="mailto:hello@firecms.co">email</a> or on our <a
                    href="https://twitter.com/gatti675">Twitter account</a> and we will add it to the library.
                </p>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
