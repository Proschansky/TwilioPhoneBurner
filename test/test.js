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