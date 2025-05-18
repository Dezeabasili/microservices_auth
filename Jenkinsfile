pipeline {
    agent any
    environment {
        DOCKER_CRIDENTIALS_ID = 'dockerhub-jenkins'
        DOCKER_REGISTRY = 'https://hub.docker.com/u/doneze'
        DOCKER_HUB_REPO = 'doneze/auth'
        // Use dynamic versioning here (example uses fixed TAG for simplicity)
        TAG = '1.0.42'
        // MAJOR_VERSION = 1
        // MINOR_VERSION = 0
        // PATCH_VERSION = 0
        // INITIAL_PATCH_VERSION = 0
    }

    stages {
        stage('Clone repositories') {
            steps {
                cleanWs()
                dir('kubernetes_repo') {
                    git url: 'https://github.com/Dezeabasili/microservices_kubernetes.git', 
                     branch: 'main', 
                     credentialsId: 'github-cred'
                }               
                dir('auth_services_repo') {
                    git url: 'https://github.com/Dezeabasili/microservices_auth.git', 
                     branch: 'main', 
                     credentialsId: 'github-cred'
                }               
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    def MAJOR_VERSION = readFile file: 'kubernetes_repo/tags_folder/major_version.txt'
                    def MINOR_VERSION = readFile file: 'kubernetes_repo/tags_folder/minor_version.txt'
                    def INITIAL_PATCH_VERSION = readFile file: 'kubernetes_repo/tags_folder/patch_version.txt'
                    def PATCH_VERSION = (INITIAL_PATCH_VERSION.trim()).toInteger()
                    // if the value of INITIAL_PATCH_VERSION is not equal to 0, increase the value of INITIAL_PATCH_VERSION by 1 
                    if (PATCH_VERSION != 0) {
                        PATCH_VERSION += 1
                    }
                    env.DOCKER_TAG = "$MAJOR_VERSION:$MINOR_VERSION:$PATCH_VERSION"
                    env.NEW_PATCH_VERSION = "$PATCH_VERSION"
                    echo "$DOCKER_TAG"
                    echo "Hello"
                    // dockerImage = docker.build("$DOCKER_HUB_REPO:$DOCKER_TAG", "-f Dockerfile .")
                }
            }
        }



        stage('Push To Docker') {
            steps {
                script {
                    echo "$DOCKER_TAG"
                    // docker.withRegistry('https://registry.hub.docker.com', "$DOCKER_CRIDENTIALS_ID") {dockerImage.push("$DOCKER_TAG")}
                }
            }
        }


       
        stage('Modify Image Tag') {
            steps {
                dir('kubernetes_repo') {
                    script {
                    sh '''
                        # Fix the sed command to replace the entire line
                        sed -i "s|image:.*|image: doneze/auth_services:${DOCKER_TAG}|" \
                            kubernetes-manifests/microservices-folders/auth/auth-deployment.yaml

                        echo "$NEW_PATCH_VERSION" > tags_folder/patch_version.txt
                    '''
                }
                }
                
            }
        }



        stage('Commit & Push') {
            steps {

                withCredentials([usernamePassword(
                    credentialsId: 'github-cred', 
                    passwordVariable: 'GIT_PASSWORD', 
                    usernameVariable: 'GIT_USERNAME'
                )]) { dir('kubernetes_repo') {
                    sh '''
                        git config user.name "Dezeabasili"
                        git config user.email "ezeabasili@yahoo.co.uk"
                        
                        # Check if there are changes to commit
                        if git diff --quiet; then
                            echo "No changes to commit."
                        else
                            git add .
                            git commit -m "[ci skip] Update image tag to ${DOCKER_TAG}"
                            git push "https://${GIT_USERNAME}:${GIT_PASSWORD}@github.com/Dezeabasili/microservices_kubernetes.git"
                        fi
                    '''
                }
                    
                }
            }
        }
    }
}






// pipeline {
//     agent any
//     environment {
//         DOCKER_CRIDENTIALS_ID = 'dockerhub-jenkins'
//         DOCKER_REGISTRY = 'https://hub.docker.com/u/doneze'
//         DOCKER_HUB_REPO = 'doneze/auth'
//         // Use dynamic versioning here (example uses fixed TAG for simplicity)
//         TAG = '1.0.42'
//     }

//     stages {
//         stage('Checkout Code') {
//             steps {
//                 git url: 'https://github.com/Dezeabasili/microservices_kubernetes.git', 
//                      branch: 'main', 
//                      credentialsId: 'github-cred'
//             }
//         }

//         stage('Build Docker Image') {
//             steps {
//                 script {
//                     dockerImage = docker.build("$DOCKER_HUB_REPO:$TAG", "-f auth_services/Dockerfile ./auth_services")
//                 }
//             }
//         }
//         stage('Push To Docker') {
//             steps {
//                 script {
//                     docker.withRegistry('https://registry.hub.docker.com', "$DOCKER_CRIDENTIALS_ID") {dockerImage.push("$TAG")}
//                 }
//             }
//         }
       
//         stage('Modify Image Tag') {
//             steps {
//                 script {
//                     sh '''
//                         # Fix the sed command to replace the entire line
//                         sed -i "s|image:.*|image: doneze/auth_services:${TAG}|" \
//                             kubernetes-manifests/microservices-folders/auth/auth-deployment.yaml
//                     '''
//                 }
//             }
//         }

//         stage('Commit & Push') {
//             steps {
//                 withCredentials([usernamePassword(
//                     credentialsId: 'github-cred', 
//                     passwordVariable: 'GIT_PASSWORD', 
//                     usernameVariable: 'GIT_USERNAME'
//                 )]) {
//                     sh '''
//                         git config user.name "Jenkins"
//                         git config user.email "jenkins@example.com"
                        
//                         # Check if there are changes to commit
//                         if git diff --quiet; then
//                             echo "No changes to commit."
//                         else
//                             git add .
//                             git commit -m "[ci skip] Update image tag to ${TAG}"
//                             git push "https://${GIT_USERNAME}:${GIT_PASSWORD}@github.com/Dezeabasili/microservices_kubernetes.git"
//                         fi
//                     '''
//                 }
//             }
//         }
//     }
// }





// pipeline {
//     agent any
//     environment {
//         MAJOR_VERSION = 1
//         MINOR_VERSION = 0
//         PATCH_VERSION = 0
//         DOCKER_CRIDENTIALS_ID = 'dockerhub-jenkins'
//         DOCKER_REGISTRY = 'https://hub.docker.com/u/doneze'
//         DOCKER_HUB_REPO = 'doneze/auth'
//         TAG = '1.0.43'
//     }

//     stages {
//         stage('Build') {
//             steps {
//                 cleanWs()
//                 sh '''
//                     mkdir -p tags_folder
//                     touch tags_folder/major_version.txt
//                     touch tags_folder/minor_version.txt
//                     touch tags_folder/patch_version.txt
//                     echo '2' >> tags_folder/major_version.txt
//                     echo '4' >> tags_folder/minor_version.txt
//                     echo '6' >> tags_folder/patch_version.txt
//                     MAJOR_VERSION=$(cat tags_folder/major_version.txt)
//                     MINOR_VERSION=$(cat tags_folder/minor_version.txt)
//                     PATCH_VERSION=$(cat tags_folder/patch_version.txt)
//                     PATCH_VERSION=$(( PATCH_VERSION + 1))
//                     echo "$MAJOR_VERSION"
//                     echo "$MINOR_VERSION"
//                     echo "$PATCH_VERSION"
//                 '''
//             }
//         }
//         stage('Checkout Code') {
//             steps {
//                 git url: 'https://github.com/Dezeabasili/hotel_kubernetes.git', branch: 'main', credentialsId: 'github-cred'
//             }
//         }
//         // stage('Build Docker Image') {
//         //     steps {
//         //         script {
//         //             dockerImage = docker.build("$DOCKER_HUB_REPO:$TAG", "-f auth_services/Dockerfile ./auth_services")
//         //         }
//         //     }
//         // }
//         // stage('Push To Docker') {
//         //     steps {
//         //         script {
//         //             docker.withRegistry('https://registry.hub.docker.com', "$DOCKER_CRIDENTIALS_ID") {dockerImage.push("$TAG")}
//         //         }
//         //     }
//         // }
//         // stage('Clone Repository') {
//         //     steps {
//         //         withCredentials([usernamePassword(credentialsId: 'github-cred', passwordVariable: 'GIT_PASSWORD', usernameVariable: 'GIT_USERNAME')]) {
//         //             sh '''
//         //                 #!/bin/bash
//         //                 set -x
//         //                 REPO_URL="https://${GIT_USERNAME}:${GIT_PASSWORD}@github.com/Dezeabasili/hotel_kubernetes.git"
//         //                 git clone "$REPO_URL" /tmp/temp_repo
//         //             '''
//         //         }
//         //     }
//         // }
//         stage('Modify Files') {
//             steps {
//                 sh '''
//                     cd /tmp/temp_repo
//                     git config user.name "Dezeabasili"
//                     git config user.email "ezeabasili@yahoo.co.uk"
//                     sed -i "s|image:.*|image: doneze/auth_services:1.0.43|" kubernetes-manifests-for-gitops/kubernetes-manifests/microservices-folders/auth/auth-deployment.yaml
//                 '''
//             }
//         }
//         stage('Commit & Push') {
//             steps {
//                 withCredentials([usernamePassword(
//                     credentialsId: 'github-cred', 
//                     passwordVariable: 'GIT_PASSWORD', 
//                     usernameVariable: 'GIT_USERNAME'
//                 )]) {
//                     sh '''
//                         git config user.name "Jenkins"
//                         git config user.email "jenkins@example.com"
                        
//                         # Check if there are changes to commit
//                         if git diff --quiet; then
//                             echo "No changes to commit."
//                         else
//                             git add .
//                             git commit -m "[ci skip] Update image tag to 1.0.43"
//                             git push "https://${GIT_USERNAME}:${GIT_PASSWORD}@github.com/Dezeabasili/hotel_kubernetes.git"
//                         fi
//                     '''
//                 }
//             }
//         }
//     }
// }






// pipeline {
//     agent any
//     environment {
//         FILE_NAME = 'computer.txt'
//     }

//     stages {
//         stage('Hello') {
//             steps {
//                 cleanWs()
//                 echo 'Hello World!!'
//                 echo 'Updated Jenkins webhook security'
//                 echo "The file name is $FILE_NAME"
//             }
//         }
//         stage('WriteFile') {
//             steps {
//                 sh '''
//                     mkdir build
//                     touch build/laptop.txt
//                     echo 'Really cool' >> build/laptop.txt
//                 '''
//             }
//         }
//         stage('TestFile') {
//             steps {
//                 echo 'Test for file presence'
//                 sh 'test -f  build/laptop.txt'
//             }
//         }
//     }
//     post {
//         success {
//             archiveArtifacts artifacts: 'build/**'
//         }
//     }
// }
