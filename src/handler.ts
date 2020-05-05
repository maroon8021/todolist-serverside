import { DynamoDB } from "aws-sdk"
import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import 'source-map-support/register';

const TABLE_NAMES = {
  TIMELIST:'todo-list3-timelist',
  REMAINING_TASKS: 'todolist3-remaining-tasks'
}

const dynamoOptions = process.env.LOCAL ? { region: 'localhost', endpoint: 'http://localhost:50000' } : { region: 'ap-northeast-1' }
const dynamo = new DynamoDB.DocumentClient(dynamoOptions)

export const hello: APIGatewayProxyHandler = async (event, _context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go! Serverless Webpack (Typescript) v1.0! Your function executed successfully!',
      input: event,
    }, null, 2),
  };
}

export type GetRemainingTasksProp = APIGatewayProxyEvent & {
  userId: string
}
export const getRemainingTasks: APIGatewayProxyHandler = async (event:GetRemainingTasksProp) => {
  const params = {
    TableName: TABLE_NAMES.REMAINING_TASKS,
    Key: {
      id: event.userId
    }
  }
  try {
    const remainingTasks = await dynamo.get(params)
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: remainingTasks
      })
    }
  } catch (error) {
    console.error(error)
  }

  return {
    statusCode: 404,
    body: JSON.stringify({
      message: 'test'
    })
  }
}
