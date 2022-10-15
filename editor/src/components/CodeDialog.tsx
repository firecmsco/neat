import {
    Box,
    Button,
    Dialog, DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle, TextField
} from "@mui/material";
import React from "react";
import { NeatConfig } from "@camberi/neat";

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
            <DialogTitle>We are almost there!</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    <p>Neat gradient is not ready yet.</p>
                    <p>You can save the configuration you have created by saving
                        the following
                        snippet.
                    </p>
                    <p>If you think you have a great combination, feel free to share it with us by <a
                        href="mailto:hello@camberi.com">email</a> or on our <a
                        href="https://twitter.com/gatti675">Twitter account</a>
                        and we will add it to the library.
                    </p>
                </DialogContentText>
                <Box component={"pre"}
                     sx={{
                         p: 2,
                         borderRadius: "8px",
                         background: "#333",
                         color: "#fff",
                     }}>
                    {JSON.stringify(config, null, 4)}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
