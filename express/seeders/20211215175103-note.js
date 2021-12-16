'use strict';
var { hashPassword, makeString } = require('../util');
var { readFileSync } = require('fs');
var { join } = require('path');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
   const date = '2021-03-14';
   const users = [
    {username: 'Dean', password: await hashPassword('Dean'), createdAt: date, updatedAt: date},
    {username: 'Jane', password: await hashPassword(makeString(10)), createdAt: date, updatedAt: date},
    {username: 'John', password: await hashPassword(makeString(10)), createdAt: date, updatedAt: date},
    {username: 'Andrew', password: await hashPassword(makeString(10)), createdAt: date, updatedAt: date},
    {username: 'Chloe', password: await hashPassword('ABCD'), createdAt: date, updatedAt: date},
    {username: 'Louis', password: await hashPassword('5678'), createdAt: date, updatedAt: date},
    {username: 'Laura', password: await hashPassword(makeString(10)), createdAt: date, updatedAt: date},
    {username: 'Heather', password: await hashPassword('1234'), createdAt: date, updatedAt: date},
    {username: 'Scarlett', password: await hashPassword('1234'), createdAt: date, updatedAt: date},
    {username: 'Alba', password: await hashPassword('abcd'), createdAt: date, updatedAt: date},
   ];
   await queryInterface.bulkInsert('Users', users);

   const beeMovieScript = readFileSync(join(__dirname, '..', 'test', 'data', 'bee-movie.txt')).toString();
   const data1 = readFileSync(join(__dirname, '..', 'test', 'data', 'data-1.txt')).toString();
   const data2 = readFileSync(join(__dirname, '..', 'test', 'data', 'data-2.txt')).toString();
   await queryInterface.bulkInsert('Notes', [
     {title: 'Deans SPECIAL note', content: beeMovieScript, createdAt: date, updatedAt: date, username: 'Dean'},
     {title: 'Deans note 2', content: data1, createdAt: date, updatedAt: date, username: 'Dean'},
     {title: 'Deans note 3', content: data2, createdAt: date, updatedAt: date, username: 'Dean'},
     {title: 'Janes note 1', content: 'This is a Jane note', createdAt: date, updatedAt: date, username: 'Jane'},
     {title: 'Janes note 2', content: 'Content but for Jane', createdAt: date, updatedAt: date, username: 'Jane'},
     {title: 'Chloes note 1', content: 'Chloes stuff', createdAt: date, updatedAt: date, username: 'Chloe'},
     {title: 'Chloes note 2', content: 'This is a Chloe note', createdAt: date, updatedAt: date, username: 'Chloe'},
     {title: 'Chloes note 3', content: 'Wow ANOTHER Chloe note!', createdAt: date, updatedAt: date, username: 'Chloe'},
     {title: 'Heathers note', content: 'Heather note', createdAt: date, updatedAt: date, username: 'Heather'},
     {title: 'Andrews note 1', content: 'Andrew note', createdAt: date, updatedAt: date, username: 'Andrew'},
     {title: 'Andrews note 2', content: 'Andrew note redux', createdAt: date, updatedAt: date, username: 'Andrew'},
     {title: 'Albas note 1', content: 'Albas content', createdAt: date, updatedAt: date, username: 'Alba'},
     {title: 'Albas note 2', content: 'This is more Alba stuff', createdAt: date, updatedAt: date, username: 'Alba'},
   ]);
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
     await queryInterface.bulkDelete('Users', null, {cascade: true});
  }
};
