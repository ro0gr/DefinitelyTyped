import { computed, set } from '@ember/object';
import Model, { attr, belongsTo, AsyncBelongsTo, hasMany, AsyncHasMany, SyncHasMany } from '@ember-data/model';
import DS, { ChangedAttributes } from 'ember-data';
import RSVP from 'rsvp';
import { assertType } from './lib/assert';

declare module 'ember-data/types/registries/model' {
    export default interface ModelRegistry {
        user: InstanceType<typeof User>;
        person: Person;
        human: Human;
    }
}

class Person extends Model.extend({
    firstName: attr(),
    lastName: attr(),
    title: attr({ defaultValue: 'The default' }),
    title2: attr({ defaultValue: () => 'The default' }),

    fullName: computed('firstName', 'lastName', function () {
        return `${this.get('firstName')} ${this.get('lastName')}`;
    }),
}) {}

const User = Model.extend({
    username: attr('string'),
    email: attr('string'),
    verified: attr('boolean', { defaultValue: false }),
    canBeNull: attr('boolean', { allowNull: true }),
    createdAt: attr('date', {
        defaultValue() {
            return new Date();
        },
    }),
    mother: belongsTo('person'),
    motherSync: belongsTo('person', { async: false }),
    father: belongsTo('person'),
    friends: hasMany('human'),
});

class Human extends Model {
    @attr age: number;
    @belongsTo('human') mother: AsyncBelongsTo<Human>;
    @belongsTo('human', { async: false }) motherSync: Human;
    @belongsTo('human') motherNullable: AsyncBelongsTo<Human> | null;
    @belongsTo('human') father: AsyncBelongsTo<Human | null>;
    @belongsTo('human', { async: false }) fatherSync: Human | null;
    @belongsTo('human', { async: false }) fatherSyncOptional?: Human;
    @hasMany('person') children: AsyncHasMany<Person>;
    @hasMany('person', { async: false }) childrenSync: SyncHasMany<Person>;

    testOwnBelongsTo() {
        assertType<DS.BelongsToReference<Human>>(
            this.belongsTo('motherSync')
        );

        assertType<DS.BelongsToReference<Human>>(
            this.belongsTo('mother')
        );
    }

    testOwnHasMany() {
        assertType<DS.HasManyReference<Person>>(
            this.hasMany('childrenSync')
        );

        assertType<DS.HasManyReference<Person>>(
            this.hasMany('children')
        );
    }
}

const user = User.create({ username: 'dwickern' });
user.get('id'); // $ExpectType string
user.get('username'); // $ExpectType string
user.get('verified'); // $ExpectType boolean
user.get('createdAt'); // $ExpectType Date
user.get('mother'); // $ExpectType AsyncBelongsTo<Person | null>
user.get('motherSync'); // $ExpectType Person | null

user.serialize();
user.serialize({ includeId: true });
user.serialize({ includeId: true });

const human = Human.create({ age: 42 });
human.get('mother'); // $ExpectType AsyncBelongsTo<Human>
human.get('father'); // $ExpectType AsyncBelongsTo<Human | null>
human.get('mother').then((m) => {
  m; // $ExpectType Human
});
human.get('father').then((f) => {
  f; // $ExpectType Human | null
});

const attributes: ChangedAttributes = user.changedAttributes();

user.rollbackAttributes(); // $ExpectType void

let destroyResult: RSVP.Promise<typeof user>;
destroyResult = user.destroyRecord();
destroyResult = user.destroyRecord({});
destroyResult = user.destroyRecord({ adapterOptions: {} });
destroyResult = user.destroyRecord({ adapterOptions: { waffles: 'are yummy' } });

user.deleteRecord(); // $ExpectType void

user.unloadRecord(); // $ExpectType void

let jsonified: object;
jsonified = user.toJSON();
jsonified = user.toJSON({ includeId: true });

let reloaded: RSVP.Promise<typeof user>;
reloaded = user.reload();
reloaded = user.reload({});
reloaded = user.reload({ adapterOptions: {} });
reloaded = user.reload({ adapterOptions: { fastAsCanBe: 'yessirree' } });

function testBelongsTo() {
    human.belongsTo('mother'); // $ExpectType BelongsToReference<Human>

    human.belongsTo('motherSync'); // $ExpectType BelongsToReference<Human>

    human.belongsTo('fatherSync'); // $ExpectType BelongsToReference<Human | null>

    human.belongsTo('fatherSyncOptional'); // $ExpectType BelongsToReference<Human | null>

    // wrong relationship kind
    human.belongsTo('children'); // $ExpectType never

    human.belongsTo('undefined'); // $ExpectError
}

function testBelongsSetter() {
    set(human, 'mother', null); // $ExpectError

    set(human, 'motherSync', null); // $ExpectError

    set(human, 'motherNullable', null);

    set(human, 'fatherSync', null);
}

function testHasMany() {
    human.hasMany('children'); // $ExpectType HasManyReference<Person>

    human.hasMany('childrenSync'); // $ExpectType HasManyReference<Person>

    // wrong relationship kind
    human.hasMany('mother'); // $ExpectType never

    human.hasMany('undefined'); // $ExpectError
}
