import React, { useState } from "react";
import JSON5 from 'json5';

import { NeatConfig } from "@firecms/neat";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextareaAutosize } from "@firecms/ui";
import { NEAT_PRESET } from "./presets";

export function ImportConfigDialog({
    open,
    onOpenChange,
    onConfigImport
}: {
    open: boolean,
    onOpenChange: (open: boolean) => void;
    onConfigImport: (config: NeatConfig) => void;
}) {
    const [jsonInput, setJsonInput] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleImport = () => {
        try {
            // Parse the JSON input
            const parsedConfig = JSON5.parse(jsonInput);

            // Validate basic structure
            if (typeof parsedConfig !== 'object' || parsedConfig === null) {
                throw new Error("Invalid configuration: must be an object");
            }

            // Create complete config by applying defaults from NEAT_PRESET for missing values
            const completeConfig: NeatConfig = {
                ...NEAT_PRESET,
                ...parsedConfig,
                // Handle colors array specially to preserve structure
                colors: Array.isArray(parsedConfig.colors)
                    ? parsedConfig.colors.map((color: any, index: number) => ({
                        color: color.color || NEAT_PRESET.colors[index % NEAT_PRESET.colors.length].color,
                        enabled: color.enabled !== undefined ? color.enabled : NEAT_PRESET.colors[index % NEAT_PRESET.colors.length].enabled
                    }))
                    : NEAT_PRESET.colors
            };

            // Pass validated config to parent
            onConfigImport(completeConfig);

            // Reset and close
            setError(null);
            setJsonInput("");
            onOpenChange(false);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Invalid JSON format");
        }
    };

    const handleClose = () => {
        setError(null);
        setJsonInput("");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange} maxWidth={"4xl"}>
            <DialogTitle variant={"h5"} className={"mb-4"}>Import Configuration</DialogTitle>

            <DialogContent>
                <div className={"space-y-4"}>
                    <p>
                        Paste a valid NEAT configuration JSON to import. Any missing fields will use default values.
                    </p>

                    <TextareaAutosize
                        className={"w-full h-64 p-3 font-mono text-sm"}
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder={`Paste your configuration here...\n\nExample:\n${JSON5.stringify(NEAT_PRESET, null, 2)}`}
                    />

                    {error && (
                        <div className={"text-red-500 text-sm mt-2"}>
                            Error: {error}
                        </div>
                    )}
                </div>
            </DialogContent>

            <DialogActions>
                <Button variant="text" onClick={handleClose}>Cancel</Button>
                <Button onClick={handleImport} disabled={!jsonInput.trim()}>Import</Button>
            </DialogActions>
        </Dialog>
    );
}
