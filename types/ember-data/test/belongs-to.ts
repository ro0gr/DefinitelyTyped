import DS from 'ember-data';
import { assertType } from './lib/assert';

declare const store: DS.Store;

class Folder extends DS.Model {
    name = DS.attr('string');
    children = DS.hasMany('folder', { inverse: 'parent' });
    parent = DS.belongsTo('folder', { inverse: 'children' });
    parentSync = DS.belongsTo('folder', { inverse: 'children', async: false });
}

declare module 'ember-data/types/registries/model' {
    export default interface ModelRegistry {
        folder: Folder;
    }
}

const folder = Folder.create();
assertType<DS.AsyncBelongsTo<Folder>>(folder.get('parent'));
assertType<string | undefined>(folder.get('parent').get('name'));
folder.get('parent').set('name', 'New');
folder.get('parent').then(parent => {
    assertType<Folder>(parent);
    assertType<string>(parent.get('name'));
    folder.set('parent', parent);
});

folder.set('parent', folder);
folder.set('parent', folder.get('parent'));
folder.set('parent', store.findRecord('folder', 3));

folder.belongsTo('parent').value(); // $ExpectType Folder | null
folder.belongsTo('parentSync').value(); // $ExpectType Folder | null
folder.belongsTo('name'); // $ExpectType never
folder.belongsTo('non-existing').value(); // $ExpectError
