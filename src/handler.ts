import { DynamoDB } from "aws-sdk"
import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
//import 'source-map-support/register';

export const TABLE_NAMES = {
  TIMELIST:'todolist3-timelist',
  REMAINING_TASKS: 'todolist3-remaining-tasks'
}
const URL = process.env.URL
const isLocal = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development'
const dynamoOptions = isLocal  ? { region: 'ap-northeast-1', endpoint: 'http://localhost:50000' } : { region: 'ap-northeast-1' }
const dynamo = new DynamoDB.DocumentClient(dynamoOptions)

export type PostProp = APIGatewayProxyEvent & {
  body: string
}

export type GetRemainingTasksProp = APIGatewayProxyEvent & {
  queryStringParameters : {
    userId: string
  }
}
export const getRemainingTasks: APIGatewayProxyHandler = async (event:GetRemainingTasksProp) => {
  const { userId } = event.queryStringParameters
  const params = {
    TableName: TABLE_NAMES.REMAINING_TASKS,
    Key: {
      userId
    }
  }
  let result = getDefaultResult()
  try {
    const remainingTasks = await dynamo.get(params).promise()
    result.body = JSON.stringify({
      content: remainingTasks.Item.content
    })
  } catch (error) {
    console.error(error)
  }

  return result
}


export type PostRemainingTasksPropBase = {
  userId: string
  content: string
}

export const postRemaingTasks: APIGatewayProxyHandler = async (event:PostProp) => {
  const { userId } = JSON.parse(event.body)
  const params = {
    TableName: TABLE_NAMES.REMAINING_TASKS,
    Key: {
      userId
    }
  }
  let hasValue = false
  try {
    const remainingTasks = await dynamo.get(params).promise()
    hasValue = remainingTasks !== null && typeof remainingTasks === 'object' // isObject
    
  } catch (error) {
    console.log(error)
  }

  return hasValue ? updateRemainigTasks(event) : createNewRemainingTasks(event)

}

const updateRemainigTasks = async (event:PostProp) => {
  const { userId, content } = JSON.parse(event.body)
  const params = {
    TableName: TABLE_NAMES.REMAINING_TASKS,
    Key: {
      userId
    },
    UpdateExpression: 'set content = :r',
    ExpressionAttributeValues:{
      ":r": escapeEmptyString(content),
    },
    ReturnValues:"UPDATED_NEW"
  }
  let result = getDefaultResult('Data is not put correctly')

  try {
    /* const remainingTasks = */ 
    await dynamo.update(params).promise()
    //console.log(remainingTasks)
    result.body = JSON.stringify({
      message: 'updated'
    })
  } catch (error) {
    // console.error(error)
  }

  return result
}

const createNewRemainingTasks = async (event:PostProp) => {
  const { userId, content } = JSON.parse(event.body)
  const params = {
    TableName: TABLE_NAMES.REMAINING_TASKS,
    Item: {
      userId,
      content: escapeEmptyString(content)
    }
  }
  let result = getDefaultResult('Data is not put correctly')

  try {
    /* const remainingTasks = */ 
    await dynamo.put(params).promise()
    // console.log(remainingTasks)
    result.body = JSON.stringify({
      message: 'created'
    })
    
  } catch (error) {
    console.error(error)
  }

  return result
  
}


type GetTimeListsProp = APIGatewayProxyEvent & {
  queryStringParameters : {
    userId: string
  }
}

export const getTimeLists: APIGatewayProxyHandler = async (event:GetTimeListsProp) => {
  const today = getToday()
  const { userId } = event.queryStringParameters
  const params = {
    TableName: TABLE_NAMES.TIMELIST,
    FilterExpression: '#de = :date',
    KeyConditionExpression: "#ud = :userId",
    ExpressionAttributeNames:{
        "#ud": "userId",
        "#de": "date"
    },
    ExpressionAttributeValues: {
        ":userId": userId,
        ":date": today
    }
  }
  let result = getDefaultResult()
  try {
    const timelistResult = await dynamo.query(params).promise()
    const dummyTimeLists = [...Array(11)].map(_ => {})
    const timelists = dummyTimeLists.map((_, index) => {
      let title = ''
      let content = ''
      const target = timelistResult.Items.find(item => {
        return item.timeListIndex === index
      })
      if(target){
        title = target.title
        content = target.content
      }
      return {
        title,
        content
      }
    })
    result.body = JSON.stringify({
      timelists
    })
    
  } catch (error) {
    console.log(error)
  }

  return result

}

export type PostTimeListsPropBase = {
  userId: string
  timeListIndex: number
  title: string
  content: string
}

export const postTimeLists: APIGatewayProxyHandler = async (event:PostProp) => {
  const { userId, timeListIndex } = JSON.parse(event.body)
  const today = getToday()
  const params = {
    TableName: TABLE_NAMES.TIMELIST,
    FilterExpression: '#tx = :timeListIndex and #de = :date',
    KeyConditionExpression: "#ud = :userId",
    ExpressionAttributeNames:{
        "#ud": "userId",
        "#de": "date",
        "#tx": "timeListIndex"
    },
    ExpressionAttributeValues: {
        ":userId": userId,
        ":date": today,
        ":timeListIndex": timeListIndex
    }
    
  }
  let hasValue = false
  let timeListId = 0
  try {
    const timelist = await dynamo.query(params).promise()
    hasValue = timelist.Items.length > 0
    if(hasValue){
      timeListId = timelist.Items[0].id
    }
    
  } catch (error) {
    //console.log(error)
  }

  return hasValue ? updateTimeList(event, timeListId) : createNewTimeList(event)

}

const updateTimeList = async (event:PostProp, id:number) => {
  const { title, content, userId } = JSON.parse(event.body)
  const params = {
    TableName: TABLE_NAMES.TIMELIST,
    Key: {
      id,
      userId
    },
    UpdateExpression: 'set title = :title, content = :content',
    ExpressionAttributeValues:{
      ":title": escapeEmptyString(title),
      ":content": escapeEmptyString(content),
    },
    ReturnValues:"UPDATED_NEW"
  }
  let result = getDefaultResult('Data is not put correctly')

  try {
    /* const remainingTasks = */ 
    await dynamo.update(params).promise()
    //console.log(remainingTasks)
    result.body = JSON.stringify({
      message: 'updated'
    })
    
  } catch (error) {
    console.error(error)
  }

  return result
}

const createNewTimeList = async (event:PostProp) => {
  const { userId, title, content, timeListIndex } = JSON.parse(event.body)
  const date = getToday()
  let getCountParams = {
    TableName : TABLE_NAMES.TIMELIST,
    Key : 'id',
    Select : 'COUNT'
  }
  const items = await dynamo.scan(getCountParams).promise();
  const count = items.Count
  const params = {
    TableName: TABLE_NAMES.TIMELIST,
    Item: {
      id: count + 1,
      userId,
      title: escapeEmptyString(title),
      content: escapeEmptyString(content),
      timeListIndex,
      date
    }
  }
  let result = getDefaultResult('Data is not put correctly')
  try {
    /* const remainingTasks = */ 
    await dynamo.put(params).promise()
    // console.log(remainingTasks)
    result.body = JSON.stringify({
      message: 'created'
    })
  } catch (error) {
    console.error(error)
  }

  return result
  
}



function getDefaultResult(message = 'This is NOT correct data'): APIGatewayProxyResult{
  let result : APIGatewayProxyResult = {
    statusCode: 200,
    body: JSON.stringify({
      message
    }),
    headers: {
      "Access-Control-Allow-Origin" : URL,
      "Access-Control-Allow-Credentials": "true"
  },
  }
  return result
}

function getToday(){
  let date = new Date()
  let year = date.getFullYear();
  let month = ("00" + (date.getMonth()+1)).slice(-2);
  let day = ("00" + date.getDate()).slice(-2);
  return year + '-' + month + '-' + day;
}

function escapeEmptyString(str: string){
  return str !== '' ? str : ' '

}

// test method for production
export type GetSampleDataProp = APIGatewayProxyEvent & {
  queryStringParameters : {
    sample: string
  }
}

export const getSampleData: APIGatewayProxyHandler =  async (event:GetSampleDataProp) => {
  const sample = event.queryStringParameters.sample === undefined ? 'nothing' : event.queryStringParameters.sample
  let result = {
    statusCode: 200,
    body: JSON.stringify({
      message: sample + '_updated_0509_1320'
    })
  }
  return result
}