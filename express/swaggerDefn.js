const { httpMessages } = require('./util');

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
            UsernamePassword: {
                type: 'object',
                properties: {
                    username: {
                        type: 'string',
                        example: 'Dean'
                    },
                    password: {
                        type: 'string',
                        example: 'Dean'
                    }
                }
            },
            NewNote: {
                type: 'object',
                properties: {
                    title: {
                        type: 'string',
                        example: 'My New Note'
                    },
                    content: {
                        type: 'string',
                        example: 'This is content...'
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
            ...httpMessages,
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
            EntryIndexItem: {
                type: 'object', 
                properties: {
                    id: {
                        type: 'number',
                        example: 1
                    },
                    title: {
                        type: 'string',
                        example: 'My First Note',
                    },
                    updatedAt: {
                        type: 'string', 
                        example: '2021-03-14T00:00:00.000Z',
                        description: 'Timestamp with time zone (timestamptz) representing when the note was last modified.'
                    }
                }
            },
            EntryIndex: {
                type: 'object',
                properties: {
                    count: {
                        type: 'number', 
                        example: 1
                    },
                    user: {
                        type: 'string',
                        example: 'dean',
                    },
                    entries: {
                        type: 'array',
                        items: {
                            $ref: '#/components/responses/EntryIndexItem'
                        }
                    }
                }
            },
            FullEntry: {
                type: 'object',
                properties: {
                    id: {
                        type: 'number',
                        example: 1
                    },
                    title: {
                        type: 'string',
                        example: 'My First Note',
                    },
                    content: {
                        type: 'string',
                        example: 'This is content...'
                    },
                    updatedAt: {
                        type: 'string', 
                        example: '2021-03-14T00:00:00.000Z',
                        description: 'Timestamp with time zone (timestamptz) representing when the note was last modified.'
                    },
                    createdAt: {
                        type: 'string', 
                        example: '2021-03-14T00:00:00.000Z',
                        description: 'Timestamp with time zone (timestamptz) representing when the note was created'
                    }
                }
            },
            ValidatorErrors: {
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
            },
            WrappedErrorResponse: {
                type: 'object',
                properties: {
                    code: {
                        type: 'number',
                        description: 'HTTP error code',
                    },
                    msg: {
                        type: 'string',
                        description: 'Summary of error'
                    }
                }
            }
        }
    }
};
