process.env.URL = 'test'

import { DynamoDB } from "aws-sdk"
import { APIGatewayProxyEvent, Context, Callback } from 'aws-lambda';
import { getRemainingTasks, postRemaingTasks, GetRemainingTasksProp, PostRemainingTasksPropBase, TABLE_NAMES, getTimeLists, PostTimeListsPropBase, PostProp, postTimeLists } from '#/handler'

const dynamoOptions = { region: 'ap-northeast-1', endpoint: 'http://localhost:50000' }
const dynamo = new DynamoDB.DocumentClient(dynamoOptions)

const dummyContext = {} as Context
const dummyCallback = {} as Callback
const eventBase = {} as APIGatewayProxyEvent

describe('RemainingTasks', ():void => {
  afterAll(() => {
    fixRemainigTasksContent();
    removeRemainingTasksDummyAccount()
  });

  test('getRemainingTasks', async ():Promise<void> => {
    const expectedResult = {
      statusCode: 200,
      body: {
        content: 'test-content'
      },
      headers: {
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Origin": "test",
      }
    }
    const queryStringParameters = {
      userId : 'test-user'
    }
    const event:GetRemainingTasksProp = Object.assign(eventBase, {
      queryStringParameters
    })
    const result = await getRemainingTasks(event, dummyContext, dummyCallback)
    if(result){
      result.body = JSON.parse(result.body)
    }
    expect(result).toStrictEqual(expectedResult)
  })

  test('updateRemainigTasks', async ():Promise<void> => {
    const expectedResult = {
      content: 'updated'
    }
    const bodyBase:PostRemainingTasksPropBase = {
      userId : 'test-user',
      content: expectedResult.content
    }
    const body = JSON.stringify(bodyBase)
    const event:PostProp = Object.assign(eventBase, {
      body
    })
    await postRemaingTasks(event, dummyContext, dummyCallback)
    
    const getResult = await getRemainingTasks(event, dummyContext, dummyCallback)
    if(!getResult){
      return
    }
    getResult.body = JSON.parse(getResult.body)
    expect(getResult.body).toStrictEqual(expectedResult)
  })

  test('createNewRemainingTasks', async ():Promise<void> => {
    const expectedResult = {
      content: 'test-user2-content'
    }
    const bodyBase:PostRemainingTasksPropBase = {
      userId : 'test-user2',
      content: expectedResult.content
    }
    const body = JSON.stringify(bodyBase)
    const event:PostProp = Object.assign(eventBase, {
      body
    })
    await postRemaingTasks(event, dummyContext, dummyCallback)
    
    const getEvent:GetRemainingTasksProp = Object.assign(eventBase, {
      queryStringParameters: {
        userId : 'test-user2'
      }
    })
    const getResult = await getRemainingTasks(getEvent, dummyContext, dummyCallback)
    if(!getResult){
      return
    }
    getResult.body = JSON.parse(getResult.body)
    expect(getResult.body).toStrictEqual(expectedResult)
  })
  
})

const fixRemainigTasksContent = async () => {
  const params = {
    TableName: TABLE_NAMES.REMAINING_TASKS,
    Key: {
      userId: 'test-user'
    },
    UpdateExpression: 'set content = :r',
    ExpressionAttributeValues:{
      ":r": 'test-content',
    },
    ReturnValues:"UPDATED_NEW"
  }

  try {
    return dynamo.update(params).promise()
  } catch (error) {
    //console.error(error)
  }
}

const removeRemainingTasksDummyAccount = async () => {
  const params = {
    TableName: TABLE_NAMES.REMAINING_TASKS,
    Key: {
      userId: 'test-user2'
    }
  }

  try {
    return dynamo.delete(params).promise()
  } catch (error) {
    //console.error(error)
  } 
}


describe('TimeLists', () => {
  afterEach(() => {
    removeTimeListsDummyAccount()
  })
  test('getTimeLists No hits', async ():Promise<void> => {
    const expectedResult = {
      statusCode: 200,
      body: {
        timelists: [...Array(11)].map(_ => ({
          title: '',
          content: ''
        }))
      },
      headers: {
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Origin": "test",
      }
    }
    const event:GetRemainingTasksProp = Object.assign(eventBase, {
      queryStringParameters: {
        userId : 'test-user'
      }
    })
    const result = await getTimeLists(event, dummyContext, dummyCallback)
    if(!result){
      return
    }
    result.body = JSON.parse(result.body)
    expect(result).toStrictEqual(expectedResult)
  })

  test('postTimeLists Add new TimeList', async ():Promise<void> => {
    const expectedResult = {
      statusCode: 200,
      body: {
        timelists: [...Array(11)].map((_, index) => {
          return {
            title: index === 4 ? 'hoge' : '',
            content: index === 4 ? 'hogehoge' : ''
          }
        })
      },
      headers: {
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Origin": "test",
      }
    }
    const bodyBase:PostTimeListsPropBase = {
      userId: 'test-user2',
      timeListIndex: 4,
      title: 'hoge',
      content: 'hogehoge',
    }
    const body = JSON.stringify(bodyBase)
    const event:PostProp = Object.assign(eventBase, {
      body
    })

    const getEvent:GetRemainingTasksProp = Object.assign(eventBase, {
      queryStringParameters: {
        userId : 'test-user2'
      }
    })

    await postTimeLists(event, dummyContext, dummyCallback)
    const getResult = await getTimeLists(getEvent, dummyContext, dummyCallback)

    if(!getResult){
      return
    }
    getResult.body = JSON.parse(getResult.body)
    expect(getResult).toStrictEqual(expectedResult)
  })

  test('postTimeLists update TimeList', async ():Promise<void> => {
    const expectedResult = {
      statusCode: 200,
      body: {
        timelists: [...Array(11)].map((_, index) => {
          return {
            title: index === 4 ? 'updated' : '',
            content: index === 4 ? 'updated-content' : ''
          }
        })
      },
      headers: {
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Origin": "test",
      }
    }
    let bodyBase:PostTimeListsPropBase = {
      userId: 'test-user2',
      timeListIndex: 4,
      title: 'hoge',
      content: 'hogehoge',
    }
    let body = JSON.stringify(bodyBase)
    let event:PostProp = Object.assign(eventBase, {
      body
    })
    await postTimeLists(event, dummyContext, dummyCallback)

    bodyBase = {
      userId: 'test-user2',
      timeListIndex: 4,
      title: 'updated',
      content: 'updated-content',
    }
    body = JSON.stringify(bodyBase)
    event = Object.assign(eventBase, { body })
    await postTimeLists(event, dummyContext, dummyCallback)
    
    const getEvent:GetRemainingTasksProp = Object.assign(eventBase, {
      queryStringParameters: {
        userId : 'test-user2'
      }
    })
    const getResult = await getTimeLists(getEvent, dummyContext, dummyCallback)

    if(!getResult){
      return
    }
    getResult.body = JSON.parse(getResult.body)
    expect(getResult).toStrictEqual(expectedResult)
  })
})


const removeTimeListsDummyAccount = async () => {
  const params = {
    TableName: TABLE_NAMES.TIMELIST,
    KeyConditionExpression: "#ud = :userId",
    ExpressionAttributeNames:{
        "#ud": "userId",
    },
    ExpressionAttributeValues: {
        ":userId": 'test-user2',
    }
  }
  return new Promise( async(resolve) => {
    try {
      const deletableItems = await dynamo.query(params).promise()
      if(deletableItems.Items.length > 0){
        deletableItems.Items.forEach( async (item, index) => {
          const params = {
            TableName: TABLE_NAMES.TIMELIST,
            Key: {
              userId: 'test-user2',
              id: item.id
            }
          }
          await dynamo.delete(params).promise()
          if(deletableItems.Items.length === index + 1){
            resolve()
          }
        }) 
      }
    } catch (error) {
      console.error(error)
    }
  })
   
}