const fs = require('fs');
const path = require('path');

/**
 * Copyright (c) 2023 Ville Perkkio
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * @class BuuTemplates
 */
const [_, __, readmePath, lectureNumber = 2, assignmentFrom = 2, assignmentTo = 5] = process.argv;

class BuuTemplates {

    constructor() {
        this.readmeFilePath = readmePath;
        this.generateTemplates();
    }

    async generateTemplates() {
        this.readme = await this.getReadmeContent();
        const assignmentBlocks = this.parseReadme( this.readme );

        if(assignmentBlocks && assignmentBlocks.length) {
            const filtered = this.filterAssignments(assignmentFrom, assignmentTo, assignmentBlocks);
            
            if(filtered && filtered.length) {
                console.log(`Generating ${filtered.length} index.ts files...`);
                
                filtered.forEach( (assignmentEntry) => {
                    const assignmentNumber = Object.keys(assignmentEntry)[0];
                    this.generateIndexTs(assignmentNumber, assignmentEntry);
                } );
            } else {
                console.log(`Error: There is no assignments in given range (${assignmentFrom}-${assignmentTo})`);
                process.exit(1);
            }
        } else {
            console.log(`Error: Assignments could not be found from the file '${this.readmeFilePath + '\\README.md'}'`);
            process.exit(1);
        }
    }

    /**
     * Generates index.ts file with the comment from assignment.
     * 
     * @param {string} assignmentNumberSuffix
     * @param {{[assignmentIdentifier: string]: string[]}} assignmentEntry 
     */
    generateIndexTs(assignmentNumberSuffix, assignmentEntry) {
        //TODO:
    }

    /**
     * Filters assignments based on given start and end numbers.
     *
     * @param {number} start assignment number from
     * @param {number} end assignment number to
     * @param {{
     *  [assignmentIdentifier: string]: string[];
     * }[]} assignmentBlocks 
     * @return {{
     *  [assignmentIdentifier: string]: string[];
     * }[]} filtered result 
     */
    filterAssignments(start, end, assignmentBlocks) {
        return assignmentBlocks.filter( (value) => {
            const [ assignmentNumber] = Object.keys( value )[0];
            return parseInt(assignmentNumber) >= start && parseInt(assignmentNumber) <= end;
        });
    }

    /**
     * Parses readme content
     * 
     * @param {string} content 
     * @return {{
     *  [assignmentIdentifier: string]: string[];
     * }[]}
     */
    parseReadme(content) {
        const regex = /## Assignment \d+\.\d+: [A-Za-z ]+\r?\n[\s\S]*?(?=\n## Assignment|$)/g;
        const assignments = content.match(regex);
        if(assignments) {
            const assignmentBlocks = assignments.map( (value) => {
                const assignmentNumber = value.match(/## Assignment (\d+)\.(\d+)/);
                const assignmentContent = value.split(/\r?\n/);
                return {
                    [`${assignmentNumber[2]}`]: assignmentContent
                };
            });

            return assignmentBlocks;
        }
    }
    
    /**
     * Returns readme content from the file.
     * @returns {Promise<String, Error>}
     */
    getReadmeContent() {
        return new Promise( (resolve, reject) => {
            fs.readFile(this.readmeFilePath + '\\README.md', function (err, data) {
                if (err) reject(err);
                resolve(data.toString());
            });
        });
    }
}

new BuuTemplates();//TODO: Remove after development

module.exports = BuuTemplates;