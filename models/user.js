var bcrypt = require('bcrypt');
var _ = require('underscore');
var cryptojs = require('crypto-js');
var jwt = require('jsonwebtoken');


module.exports = function(sequelize, DataTypes) {
	var user = sequelize.define('user', {
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			validate: {
				isEmail: true
			}
		},
		salt: {
			type: DataTypes.STRING
		},
		password_hash: {
			type: DataTypes.STRING
		},
		password: {
			type: DataTypes.VIRTUAL,
			allowNull: false,
			validate: {
				len: [7, 100]
			},
			set: function(value) {
				var salt = bcrypt.genSaltSync(10);
				var hashedPassword = bcrypt.hashSync(value, salt);

				this.setDataValue('password', value);
				this.setDataValue('salt', salt);
				this.setDataValue('password_hash', hashedPassword);
			}
		}
	}, {
		hooks: {
			beforeValidate: function(user, options) {
				if (typeof user.email === 'string') {
					user.email = user.email.toLowerCase();
				}
			}
		}
	});

	user.prototype.toPublicJSON = function(user) {
		return _.pick(user, "id", "email", "createdAt", "updatedAt");
	}

	user.prototype.generateToken = function(id, type) {
		if (!_.isString(type)) {
			return undefined;
		}

		try {
			var stringData = JSON.stringify({
				id: id,
				type: type
			})
			var encrytedData = cryptojs.AES.encrypt(stringData, 'abc321#$').toString();
			var token = jwt.sign({
				token: encrytedData
			}, "xyz123%#");

			return token;
		} catch (e) {
			return undefined;
		}
	}

	user.authenticate = function(body) {
		return new Promise(function(resolve, reject) {

			if (typeof body.email !== 'string' && typeof body.password !== 'string') {
				return reject();
			}
			user.findOne({
				where: {
					email: body.email
				}
			}).then(function(user) {
				if (!user || !bcrypt.compareSync(body.password, user.get('password_hash'))) {
					return reject();
				}
				resolve(user);
			}, function(e) {
				reject();
			})

		});
	}

	user.findByToken = function(token) {
		return new Promise(function(resolve, reject) {
			try {
				var decodeJWT = jwt.verify(token, "xyz123%#");
				var bytes = cryptojs.AES.decrypt(decodeJWT.token, 'abc321#$');
				var tokenData = JSON.parse(bytes.toString(cryptojs.enc.Utf8));
				
				user.findById(tokenData.id).then(function(user) {
					if (user) {
						resolve(user);
					} else {
						reject();
					}
				}, function(e) {
					reject();
				});
			} catch (e) {
				reject();
			}
		});
	}
	return user;
}