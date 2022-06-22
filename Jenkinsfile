def gitBranch = env.BRANCH_NAME
def imageName = "memphis-broker-${env.BRANCH_NAME}"
def gitURL = "git@github.com:Memphisdev/memphis-broker.git"
def repoUrlPrefix = "memphisos"
def test_suffix = "test"

String unique_id = org.apache.commons.lang.RandomStringUtils.random(4, false, true)

node {
  git credentialsId: 'main-github', url: gitURL
  def versionTag = readFile "./version.conf"
  
  try{
	  
    stage('Login to Docker Hub') {
	    withCredentials([usernamePassword(credentialsId: 'docker-hub', usernameVariable: 'DOCKER_HUB_CREDS_USR', passwordVariable: 'DOCKER_HUB_CREDS_PSW')]) {
		  sh 'docker login -u $DOCKER_HUB_CREDS_USR -p $DOCKER_HUB_CREDS_PSW'
	    }
    }
	  
    stage('Create memphis namespace in Kubernetes'){
      sh "kubectl config use-context minikube"
      sh "kubectl create namespace memphis-$unique_id --dry-run=client -o yaml | kubectl apply -f -"
      sh "aws s3 cp s3://memphis-jenkins-backup-bucket/regcred.yaml ."
      sh "kubectl apply -f regcred.yaml -n memphis-$unique_id"
      sh "kubectl patch serviceaccount default -p '{\"imagePullSecrets\": [{\"name\": \"regcred\"}]}' -n memphis-$unique_id"
      //sh "sleep 40"
    }

    stage('Build and push docker image to Docker Hub') {
      sh "docker buildx build --push -t ${repoUrlPrefix}/${imageName}-${test_suffix} ."
    }

    stage('Tests - Install/upgrade Memphis cli') {
      sh "sudo npm uninstall memphis-dev-cli"
      sh "sudo npm i memphis-dev-cli -g"
    }

    ////////////////////////////////////////
    //////////// Docker-Compose ////////////
    ////////////////////////////////////////

    stage('Tests - Docker compose install') {
      sh "rm -rf memphis-infra"
      dir ('memphis-infra'){
        git credentialsId: 'main-github', url: 'git@github.com:memphisdev/memphis-infra.git', branch: gitBranch //memphis-infra branch is the same as the main repo
      }
      sh "docker-compose -f ./memphis-infra/docker/docker-compose-dev-memphis-broker.yml -p memphis up -d"
    }

    stage('Tests - Run e2e tests over Docker') {
      sh "rm -rf memphis-e2e-tests"
      dir ('memphis-e2e-tests'){
        git credentialsId: 'main-github', url: 'git@github.com:memphisdev/memphis-e2e-tests.git', branch: 'master'
      }
      sh "npm install --prefix ./memphis-e2e-tests"
      sh "node ./memphis-e2e-tests/index.js docker"
    }

    stage('Tests - Remove Docker compose') {
      sh "docker-compose -f ./memphis-infra/docker/docker-compose-dev-memphis-broker.yml -p memphis down"
      sh "docker volume prune -f"
    }

    ////////////////////////////////////////
    ////////////   Kubernetes   ////////////
    ////////////////////////////////////////

    stage('Tests - Install memphis with helm') {
      sh "helm install memphis-tests memphis-infra/kubernetes/helm/memphis --set analytics='false',teston='cp' --create-namespace --namespace memphis-$unique_id"
    }

    stage('Open port forwarding to memphis service') {
      sh(script: """until kubectl get pods --selector=app=memphis-ui -o=jsonpath="{.items[*].status.phase}" -n memphis-$unique_id  | grep -q "Running" ; do sleep 1; done""", returnStdout: true)
      sh "nohup kubectl port-forward service/memphis-ui 9000:80 --namespace memphis-$unique_id &"
      sh "nohup kubectl port-forward service/memphis-cluster 7766:7766 6666:6666 5555:5555 --namespace memphis-$unique_id &"
    }

    stage('Tests - Run e2e tests over kubernetes') {
      sh "npm install --prefix ./memphis-e2e-tests"
      sh "node ./memphis-e2e-tests/index.js kubernetes memphis-$unique_id"
    }

    stage('Tests - Uninstall helm') {
      sh "helm uninstall memphis-tests -n memphis-$unique_id"
      sh "kubectl delete ns memphis-$unique_id &"
      sh(script: """/usr/sbin/lsof -i :5555,9000 | grep kubectl | awk '{print \"kill -9 \"\$2}' | sh""", returnStdout: true)
    }
		
		if (env.BRANCH_NAME ==~ /(staging)/) {
    	stage('Tests - Remove used directories') {
      	sh "rm -rf memphis-e2e-tests"
    	}
		}
	  
    ////////////////////////////////////////
    ////////////  Build & Push  ////////////
    ////////////////////////////////////////


    stage('Build and push image to Docker Hub') {
      sh "docker buildx use builder"
      if (env.BRANCH_NAME ==~ /(beta)/) {
      	sh "docker buildx build --push --tag ${repoUrlPrefix}/${imageName}:beta --platform linux/amd64,linux/arm64 ."
	    }
			else
			{
      	sh "docker buildx build --push --tag ${repoUrlPrefix}/${imageName}:${versionTag} --tag ${repoUrlPrefix}/${imageName} --platform linux/amd64,linux/arm64 ."
		  }
		}
	  
	  
    ///////////////////////////////////////
    //////////////  STAGING  //////////////
    ///////////////////////////////////////


    stage('Push to staging'){
      if (env.BRANCH_NAME ==~ /(staging)/) {
	      sh "aws eks --region eu-central-1 update-kubeconfig --name staging-cluster"
        sh "helm uninstall my-memphis --kubeconfig ~/.kube/config -n memphis"
        sh 'helm install my-memphis memphis-infra/kubernetes/helm/memphis --set analytics="false" --kubeconfig ~/.kube/config --create-namespace --namespace memphis'
        sh "rm -rf memphis-infra"
      }
    }

    /////////////////////////////////////////////
    //////////////  BETA & MASTER  //////////////
    /////////////////////////////////////////////
    if (env.BRANCH_NAME ==~ /(beta|master)/) {  
      stage('Tests - Docker compose install') {
        sh "rm -rf memphis-docker"
        dir ('memphis-docker'){
          git credentialsId: 'main-github', url: 'git@github.com:memphisdev/memphis-docker.git', branch: 'master'
        }
        if (env.BRANCH_NAME ==~ /(beta)/) {
          sh "docker-compose -f ./memphis-docker/docker-compose-beta.yml -p memphis up -d"
        }
        else {
          sh "docker-compose -f ./memphis-docker/docker-compose.yml -p memphis up -d"
        }
      }
    

      stage('Tests - Run e2e tests over Docker') {
        sh "node ./memphis-e2e-tests/index.js docker"
      }
    
     
      stage('Tests - Remove Docker compose') {
	
			if (env.BRANCH_NAME ==~ /(beta)/) {
          sh "docker-compose -f ./memphis-docker/docker-compose-beta.yml -p memphis down"
      		sh "rm -rf memphis-e2e-tests"
        }
        else {
          sh "docker-compose -f ./memphis-docker/docker-compose.yml -p memphis down"
        }
      sh "rm -rf memphis-docker"
      }    
    }
	  
    //////////////////////////////////////
    //////////////  MASTER  //////////////
    //////////////////////////////////////
	  
    if (env.BRANCH_NAME ==~ /(master)/) { 
      stage('Tests - Install memphis with helm') {
      	sh "rm -rf memphis-k8s"
      	dir ('memphis-k8s'){
       		git credentialsId: 'main-github', url: 'git@github.com:memphisdev/memphis-k8s.git', branch: 'master'
      	}
      	sh "helm install memphis-tests memphis-k8s/memphis --set analytics='false' --create-namespace --namespace memphis"
    	}

   	 stage('Open port forwarding to memphis service') {
   	   sh(script: """until kubectl get pods --selector=app=memphis-ui -o=jsonpath="{.items[*].status.phase}" -n memphis | grep -q "Running" ; do sleep 1; done""", returnStdout: true)
   	   sh "nohup kubectl port-forward service/memphis-ui 9000:80 --namespace memphis&"
   	   sh "nohup kubectl port-forward service/memphis-cluster 7766:7766 6666:6666 5555:5555 --namespace memphis &"
   	 }


   	 stage('Tests - Run e2e tests over kubernetes') {
   	   sh "node ./memphis-e2e-tests/index.js kubernetes memphis"
   	 }

     stage('Tests - Uninstall helm') {
       sh "helm uninstall memphis-tests -n memphis"
       sh "kubectl delete ns memphis &"
       sh(script: """/usr/sbin/lsof -i :5555,9000 | grep kubectl | awk '{print \"kill -9 \"\$2}' | sh""", returnStdout: true)
    }

     stage('Tests - Remove used directories') {
       sh "rm -rf memphis-k8s"
       sh "rm -rf memphis-e2e-tests"
     }
    }
	  
	  
    notifySuccessful()
	  
  } catch (e) {
      currentBuild.result = "FAILED"
      sh "docker-compose -f ./memphis-infra/docker/docker-compose-dev-memphis-broker.yml -p memphis down"
      sh "kubectl delete ns memphis-$unique_id &"
      cleanWs()
      notifyFailed()
      throw e
  }
}

def notifySuccessful() {
  emailext (
      subject: "SUCCESSFUL: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
      body: """<p>SUCCESSFUL: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]':</p>
        <p>Check console output at &QUOT;<a href='${env.BUILD_URL}'>${env.JOB_NAME} [${env.BUILD_NUMBER}]</a>&QUOT;</p>""",
      recipientProviders: [[$class: 'DevelopersRecipientProvider']]
    )
}

def notifyFailed() {
  emailext (
      subject: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
      body: """<p>FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]':</p>
        <p>Check console output at &QUOT;<a href='${env.BUILD_URL}'>${env.JOB_NAME} [${env.BUILD_NUMBER}]</a>&QUOT;</p>""",
      recipientProviders: [[$class: 'DevelopersRecipientProvider']]
    )
}
