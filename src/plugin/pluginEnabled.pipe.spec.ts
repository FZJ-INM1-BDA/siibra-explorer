import { TestBed } from '@angular/core/testing';
import { PluginDisabledReasons } from 'src/plugin/pluginEnabled.pipe';
import { PluginManifest } from 'src/plugin/types';
import { SxplrAtlas, SxplrParcellation, SxplrTemplate } from 'src/atlasComponents/sapi/sxplrTypes';

describe('PluginDisabledReasonsPipe', () => {
    let pipe: PluginDisabledReasons;

    const defaultPlugin: PluginManifest = {
        parcellations: { allow: [] },
        spaces: { allow: [] },
        name: 'Test Plugin',
        iframeUrl: "",
        "siibra-explorer": true
    };

    const defaultAtlas: SxplrAtlas = {
        id: "atlasid",
        name: "atlasname",
        species: "atlasspecies",
        type: "SxplrAtlas"
    };
    const defaultTemplate: SxplrTemplate = { id: 'MNI', name: 'MNI Space', shortName: "", type: "SxplrTemplate" };
    const defaultParcellation: SxplrParcellation = { id: 'aparc', name: 'Aparc Parcellation', shortName: "", type: "SxplrParcellation" };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [PluginDisabledReasons],
        });
        pipe = TestBed.inject(PluginDisabledReasons);
    });

    it('should create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    describe('when parcellation is not allowed', () => {
        it('should return parcellation reason', () => {
            const testPlugin = {
                ...defaultPlugin,
                parcellations: { allow: ['other_parc'] }
            };

            const result = pipe.transform(
                testPlugin,
                defaultAtlas,
                defaultTemplate,
                defaultParcellation
            );

            expect(result).toContain('Parcellation Aparc Parcellation not in the plugin\'s allow list.');
        });
    });

    describe('when template/space is not allowed', () => {
        it('should return space reason', () => {
            const testPlugin = {
                ...defaultPlugin,
                spaces: { allow: ['fsaverage'] }
            };

            const result = pipe.transform(
                testPlugin,
                defaultAtlas,
                defaultTemplate,
                defaultParcellation
            );

            expect(result).toContain('Space MNI Space not in the plugin\'s allow list.');
        });
    });

    describe('when neither parcellation nor space is allowed', () => {
        it('should return both reasons', () => {
            const testPlugin = {
                ...defaultPlugin,
                parcellations: { allow: ['other_parc'] },
                spaces: { allow: ['fsaverage'] }
            };

            const result = pipe.transform(
                testPlugin,
                defaultAtlas,
                defaultTemplate,
                defaultParcellation
            );

            expect(result.length).toBe(2);
            expect(result.join()).toContain("Parcellation");
            expect(result.join()).toContain("Space");
        });
    });

    describe('when all are allowed', () => {
        it('should return empty array', () => {
            const testPlugin = {
                ...defaultPlugin,
                parcellations: { allow: ['aparc'] },
                spaces: { allow: ['MNI'] }
            };

            const result = pipe.transform(
                testPlugin,
                defaultAtlas,
                defaultTemplate,
                defaultParcellation
            );

            expect(result).toEqual([]);
        });
    });

    describe('empty allow lists', () => {
        it('should treat empty allow lists as disabled', () => {
            const result = pipe.transform(
                defaultPlugin,
                defaultAtlas,
                defaultTemplate,
                defaultParcellation
            );

            expect(result).toEqual([
                'Parcellation Aparc Parcellation not in the plugin\'s allow list.',
                'Space MNI Space not in the plugin\'s allow list.'
            ]);
        });
    });

    describe('mixed cases', () => {
        it('should only return relevant reasons', () => {
            const testPlugin = {
                ...defaultPlugin,
                parcellations: { allow: ['aparc'] }, // parcellation allowed
                spaces: { allow: ['fsaverage'] } // space not allowed
            };

            const result = pipe.transform(
                testPlugin,
                defaultAtlas,
                defaultTemplate,
                defaultParcellation
            );

            expect(result.length).toBe(1);
            expect(result.join()).toContain("Space");
            expect(result.join()).not.toContain("Parcellation");
        });
    });
});