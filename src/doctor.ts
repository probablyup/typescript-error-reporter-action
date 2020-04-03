import * as ts from 'typescript'
import * as fs from 'fs'
import * as path from 'path'
import { createHost, createService } from './langSvc'
import { Reporter } from './reporter'
import { FileEntry } from './types'

export class Doctor {
  private service: ts.LanguageService
  public reporter: Reporter

  scriptVersions: FileEntry = new Map()

  constructor(public fileNames: string[], private compilerOptions: ts.CompilerOptions, private debug: boolean = false) {
    const host = createHost(fileNames, compilerOptions, this.scriptVersions)
    this.service = createService(host)
    this.reporter = new Reporter()
  }

  static fromConfigFile(configPath: string, debug: boolean = false): Doctor {
    const content = fs.readFileSync(configPath).toString();
    const parsed = ts.parseJsonConfigFileContent(
        JSON.parse(content),
        ts.sys,
        path.dirname(configPath)
    );
    const rootFileNames = [
      ...parsed.fileNames
    ]
    return new Doctor(rootFileNames, parsed.options, debug)
  }

  getSemanticDiagnostics() {
    const { fileNames, service } = this
    const result = service.getProgram()!.getSemanticDiagnostics()
    // console.log(result)
    return [...result]
    // const result = fileNames.reduce((acc, ac) => {
    //   console.log('L49')
    //   console.log(ac)
    //   acc = [...acc, ...service.getSemanticDiagnostics(ac)]
    //   return acc
    // }, [] as ts.Diagnostic[])
    // return result
    return []
  }

  runDiagnostics() {
    const diagnostics = this.getSemanticDiagnostics()

    this.reporter.reportDiagnostics(diagnostics)
    this.reporter.reportDiagnosticsSummary(diagnostics)

    return {
      diagnostics
    }
  }
}
