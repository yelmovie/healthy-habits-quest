import test from 'node:test';import assert from 'node:assert/strict';import {contactAt,fresh,sanitize} from '../src/simulation/model';
test('timing changes contacts, not a diagnosis',()=>{const original=contactAt(5),early=contactAt(5,1.5),late=contactAt(5,4.5);assert.ok(early.size<original.size);assert.ok(late.size>early.size);assert.ok(late.has('ball'));});
test('trial values survive existing save validation',()=>{const s=fresh();s.timeline={tick:5,source:'book',intervention:1.5};assert.equal(sanitize(s).timeline.intervention,1.5);});
