import express, { Request, Response } from 'express';
import axios, { AxiosRequestConfig } from 'axios';
import { filter, isEmpty } from 'lodash';

const router = express.Router();


// TODO: Move types to a separate file
interface RequestQuery {
    filters: string,
    limit: number, // limit per page
}


type FillOutResponse = {
    questions: any[];
    calculations: [];
    urlParameters: [];
    quiz: {};
    submissionId: string;
    submissionTime: string;
}


type FilteredResponse = {
    responses: FillOutResponse[];
    totalResponses: number;
    pageCount: number;

};


type FilterClauseType = {
	id: string;
	condition: 'equals' | 'does_not_equal' | 'greater_than' | 'less_than';
	value: number | string;
}


// TODO: Setup error handling
router.get("/:id/filteredResponses", async (req: Request<{id: string}, {}, {}, RequestQuery>, res: Response<FilteredResponse>) => {

    // TODO: create axios instance in another file to make more modular
    const config: AxiosRequestConfig = {
        headers: { Authorization: `Bearer ${process.env.FILLOUT_DEMO_TOKEN}`}
    }
    const response = await axios.get(`${process.env.FILLOUT_BASE_URL}/${req.params.id}/submissions`, config);
    const filters: FilterClauseType[] = JSON.parse(req.query.filters);
    const limit = req.query.limit ? req.query.limit : 99; // default to 99 per page
    const filteredResponses: FillOutResponse[] = [];
    const allResponses = response.data.responses

    // No filters to apply
    if (!filters || filters.length === 0) {
        const totalResponses = response.data.responses;
        const pageCount = Math.ceil(totalResponses / limit);

        res.status(200).json({
            responses: allResponses,
            totalResponses,
            pageCount
        })
    }

    // Apply filters
    for (const item of allResponses) {

        let filteredQuestions = [];
        for (const f of filters) {
            const id = f.id;
            console.log("id", id);
            const condition = f.condition;
            const value = f.value;
            
            // NOTE: Assuming the Ids are unique so we should only get 1 item here
            const filteredById = filter(item.questions, ["id", id]);

            // No match so we need to reset
            if (isEmpty(filteredById)) {
                filteredQuestions = [];
                break;
            }

            const tempItem = filteredById[0];

            if (!tempItem) {
                filteredQuestions = [];
                break;
            }
            const filteredValue = tempItem.value;
            const valid = isValid(condition, value, filteredValue);

            // Filtered failed so we need to reset
            if (!valid) {
                filteredQuestions = [];
                break;
            }

            filteredQuestions.push(filteredById);
        }

        if (!isEmpty(filteredQuestions)) {
            filteredResponses.push({
                questions: item.questions,
                calculations: [],
                urlParameters: [],
                quiz: [],
                submissionId: item.submissionId,
                submissionTime: item.submissionTime
            })
        }
    }

    const totalResponses = filteredResponses.length;
    const pageCount = Math.ceil(totalResponses / limit);

    res.status(200).json({
        responses: filteredResponses,
        totalResponses,
        pageCount
    });
});


function isValid(condition: string, value: string | number, filteredValue: string | number) {
    switch(condition) {
        case "equals":
            return value === filteredValue;
        case "does_not_equal":
            return value !== filteredValue;
        case "greater_than":
            return filteredValue > value;
        case "less_than":
            return filteredValue > value;
    }
}
export default router;