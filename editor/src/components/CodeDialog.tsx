import React from "react";
import JSON5 from 'json5';

import { NeatConfig } from "@firecms/neat";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@firecms/ui";

export function CodeDialog({
                               open,
                               onOpenChange,
                               config
                           }: {
    open: boolean,
    onOpenChange: (open: boolean) => void;
    config: NeatConfig
}) {

    return (
        <Dialog open={open} onOpenChange={onOpenChange} maxWidth={"4xl"}>

            <DialogContent>
                <div className={"grid grid-cols-12 gap-4"}>

                    <div className={"space-y-2 col-span-4"}>
                        <DialogTitle variant={"h5"} className={"my-4"}>That gradient looks great!</DialogTitle>
                        <p>
                            Neat is a <b>free tool</b> that generates beautiful gradient animations
                            for your website. It's easy to use and offers a wide range of customization options.
                        </p>
                        <p className="mt-4">
                            Install the package using npm or yarn, following the instructions in the <a
                            href="https://github.com/FireCMSco/neat" target="_blank"
                            className="text-blue-500">GitHub page</a> and please <b>leave a star!</b> ⭐.
                        </p>

                        <p>
                            The following JSON configuration represents the current gradient you have selected.
                        </p>

                        <p>If you think you have a great combination, feel free to share it with us by <a
                            href="mailto:hello@firecms.co">email</a> or on our <a
                            href="https://twitter.com/gatti675">Twitter account</a> and we will add it to the library.
                        </p>

                    </div>
                    <div className={"col-span-8"}>
                        <pre className={"text-xs font-bold rounded-8xl bg-gray-800 text-white p-2 rounded-lg"}>
                            {JSON5.stringify(config, null, 4)}
                        </pre>
                    </div>
                </div>

            </DialogContent>
            <DialogActions>
                <Button onClick={() => onOpenChange(false)}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
