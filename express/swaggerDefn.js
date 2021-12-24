module.exports = {
    openapi: '3.0.0',
    info: {
        title: 'Journal API',
        description: 'A (very) simple journaling API. It uses Postgres and Sequelize ORM to manage data. All requests are REST API requests, and relevant endpoints are secured using JWT.',
        contact: {
            name: 'Dean Foster',
            email: 'Deanfoster45@gmail.com'
        }
    },
    servers: [
        {
            url: 'http://localhost:5050', 
            description: 'Development Server'
        }
    ],
    components: {
        schemas: {
            ArrayOfUsernames: {
                type: 'array',
                items: {
                    type: 'string',
                    example: 'dean'
                }
            },
            JWTToken: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
            },
            UsernamePassword: {
                type: 'object',
                properties: {
                    username: {
                        type: 'string',
                        example: 'dean'
                    },
                    password: {
                        type: 'string',
                        example: '1234'
                    }
                }
            },
            MalformedRequest: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        location: {
                            type: 'string',
                            description: 'Which part of the request is malformed'
                        },
                        msg: {
                            type: 'string',
                            description: 'Summary of the error'
                        },
                        param: {
                            type: 'string',
                            description: 'The offending param of the request'
                        }
                    }
                }
            }
        },
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        },
        responses: {
            UnauthorizedError: {
                description: 'The JWT token is missing or invalid'
            }
        }
    }
};
