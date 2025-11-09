import React from "react";
import JSON5 from 'json5';

import { NeatConfig } from "@firecms/neat";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";

export function GetCodeDialog({
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

            <DialogTitle>That gradient looks NEAT</DialogTitle>


            <DialogContent>
                <div className={"grid grid-cols-12 gap-4 text-white md:grid-cols-12 grid-cols-1"}>

                    <div className={"space-y-2 col-span-12 md:col-span-5"}>
                        <p>
                            Neat is a <b>free tool</b> that generates beautiful gradient animations
                            for your website. It's easy to use and offers a wide range of customization options.
                        </p>
                        <p className="mt-2 md:mt-4">
                            Install the package using npm or yarn, following the instructions in the <a
                            href="https://github.com/FireCMSco/neat" target="_blank"
                            className="text-blue-400 underline">GitHub page</a> and please <b>leave a star!</b> ⭐.
                        </p>

                        <p>
                            The following JSON configuration represents the current gradient you have selected.
                        </p>

                        <p>If you think you have a great combination, feel free to share it with us by <a
                            className="text-blue-400 underline" href="mailto:hello@firecms.co">email</a> or on our <a
                            className="text-blue-400 underline" href="https://twitter.com/gatti675">Twitter account</a> and we will add it to the library.
                        </p>

                    </div>
                    <div className={"col-span-12 md:col-span-7"}>
                        <pre className={"text-xs font-bold bg-black/40 text-white p-3 rounded-lg border border-white/10 overflow-auto max-h-[50vh]"}>
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
