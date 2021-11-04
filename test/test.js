const express = require('express');
const chai = require('chai');
const request = require('supertest');
const { expect } = require('chai');
const index = require('../index')
let should = chai.should();
let chaiHttp = require('chai-http')

chai.use(chaiHttp);

describe('GET should PING server', () => {
    it('should ping the server to verify twilio is listening', (done) => {
        request(index)
        .get('/ping')
        .end((err, res) => {
            res.should.have.status(200);
            res.text.should.be.a('string');
            res.text.should.be.eql("TWILIO PHONE BURNER IS LISTENING!");
        done();
      });
    })
})

describe('GET user', () => {

    it('should error when no query is given', (done) => {
        request(index)
        .get('/getUser')
        .end((err, res) => {
            should.not.exist(err);
            res.should.have.status(404);
            res.body.should.be.a('object');
            done();
        })
    })

    it('should get user from firebase database by email', async () => {
        const res = await chai.request(index).get('/getUser/kody.a.maus@gmail.com');
        console.log(res.body)
        expect(res).to.be.a("object")
        expect(res.status).to.eql(200)
    })
})